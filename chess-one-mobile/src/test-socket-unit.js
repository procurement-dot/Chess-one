const assert = require('assert');

// Test double for socket.io-client io()
let ioInstancesCreated = 0;
class MockSocket {
  constructor(url, opts) {
    this.url = url;
    this.opts = opts;
    this.id = 'mock-socket-' + (++ioInstancesCreated);
    this.connected = false;
    this.disconnected = true;
    this.auth = opts.auth || {};
    this.events = new Map();
    this.emitted = [];
  }

  connect() {
    this.connected = true;
    this.disconnected = false;
    this.trigger('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    this.disconnected = true;
    this.trigger('disconnect', 'io client disconnect');
    return this;
  }

  on(event, handler) {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event).add(handler);
    return this;
  }

  off(event, handler) {
    if (this.events.has(event)) {
      this.events.get(event).delete(handler);
    }
    return this;
  }

  emit(event, ...args) {
    this.emitted.push({ event, args });
  }

  trigger(event, ...args) {
    const handlers = this.events.get(event);
    if (handlers) {
      handlers.forEach((h) => h(...args));
    }
  }
}

function mockIo(url, opts) {
  return new MockSocket(url, opts);
}

// Minimal GameSocketManager logic under test
class TestGameSocketManager {
  constructor() {
    this.socket = null;
    this.listenerRegistry = new Map();
    this.reconnectedCallbacks = new Set();
    this.authErrorCallbacks = new Set();
    this.status = 'offline';
  }

  connect(token) {
    if (this.socket) {
      if (this.socket.disconnected) {
        this.status = 'connecting';
        this.socket.connect();
      }
      return this.socket;
    }

    this.status = 'connecting';
    this.socket = mockIo('http://localhost:4000', {
      auth: { token },
      transports: ['websocket', 'polling'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
    });

    this.rebindRegistry();

    this.socket.on('connect', () => {
      this.status = 'connected';
      this.reconnectedCallbacks.forEach((cb) => cb());
    });

    this.socket.on('auth:authenticated', () => {
      this.status = 'authenticated';
    });

    this.socket.on('auth:error', (err) => {
      this.status = 'auth_error';
      this.authErrorCallbacks.forEach((cb) => cb(err));
    });

    this.socket.on('disconnect', () => {
      this.status = 'offline';
    });

    return this.socket;
  }

  ensureConnected(token) {
    const socket = this.connect(token);
    if (token) {
      socket.auth = { token };
      if (socket.connected) {
        socket.emit('auth:authenticate', { token });
      }
    }
    if (socket.disconnected) {
      socket.connect();
    }
    return socket;
  }

  updateAuth(token) {
    if (!token) {
      this.disconnect();
      return;
    }
    if (this.socket) {
      const prevToken = this.socket.auth?.token;
      this.socket.auth = { token };
      if (this.socket.connected) {
        if (prevToken !== token) {
          this.socket.emit('auth:authenticate', { token });
        }
      } else {
        this.socket.connect();
      }
    } else {
      this.connect(token);
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.status = 'offline';
  }

  registerHandler(event, handler) {
    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Set());
    }
    this.listenerRegistry.get(event).add(handler);

    if (this.socket) {
      this.socket.on(event, handler);
    }

    return () => {
      const set = this.listenerRegistry.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listenerRegistry.delete(event);
        }
      }
      if (this.socket) {
        this.socket.off(event, handler);
      }
    };
  }

  rebindRegistry() {
    if (!this.socket) return;
    for (const [event, handlers] of this.listenerRegistry.entries()) {
      for (const h of handlers) {
        this.socket.off(event, h);
        this.socket.on(event, h);
      }
    }
  }
}

console.log('--- RUNNING UNIT TESTS FOR SINGLE SOCKET MANAGER ---');

const manager = new TestGameSocketManager();

// Test 1: Repeated calls to connect() returns EXACTLY ONE socket instance
const s1 = manager.connect('token-1');
const s2 = manager.connect('token-1');
const s3 = manager.connect('token-1');
assert.strictEqual(ioInstancesCreated, 1, 'Only 1 socket instance should be created by connect()');
assert.strictEqual(s1, s2, 's1 and s2 must be the exact same socket reference');
assert.strictEqual(s2, s3, 's2 and s3 must be the exact same socket reference');
console.log('✔ Test 1: Repeated connect() creates exactly 1 socket instance');

// Test 2: Repeated calls to updateAuth() and ensureConnected() in any order never create duplicate sockets
manager.updateAuth('token-2');
manager.ensureConnected('token-2');
manager.ensureConnected('token-3');
manager.updateAuth('token-3');
assert.strictEqual(ioInstancesCreated, 1, 'Still only 1 socket instance after updateAuth and ensureConnected calls');
console.log('✔ Test 2: updateAuth() and ensureConnected() in any order never create duplicate sockets');

// Test 3: Handler registration and single firing
let handlerCallCount = 0;
const unsub = manager.registerHandler('users:online-update', (payload) => {
  handlerCallCount++;
});

// Connect socket and trigger event
manager.socket.connect();
manager.socket.trigger('users:online-update', { onlineUserIds: [1, 2] });
assert.strictEqual(handlerCallCount, 1, 'Handler should fire exactly once');

// Call ensureConnected again (simulating mobile app state/visibility change)
manager.ensureConnected('token-3');
manager.socket.trigger('users:online-update', { onlineUserIds: [1, 2] });
assert.strictEqual(handlerCallCount, 2, 'Handler should fire exactly twice total (not duplicated)');
console.log('✔ Test 3: Handlers registered fire exactly once per event and are never duplicated');

// Test 4: Unsubscribe removes handler
unsub();
manager.socket.trigger('users:online-update', { onlineUserIds: [1, 2] });
assert.strictEqual(handlerCallCount, 2, 'Handler should not fire after unsubscribe');
console.log('✔ Test 4: Unsubscribe cleanly removes handler');

// Test 5: Disconnect and recreate upon new login
manager.disconnect();
assert.strictEqual(manager.socket, null, 'Socket should be null after disconnect()');
const s4 = manager.connect('token-new');
assert.strictEqual(ioInstancesCreated, 2, 'Second socket created only after explicit disconnect on logout');
console.log('✔ Test 5: New socket instance created ONLY after explicit disconnect on logout');

console.log('\nALL 5 UNIT TESTS PASSED SUCCESSFULLY! (5/5)');
