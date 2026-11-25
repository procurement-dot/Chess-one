const userStore = require("../store/user.store");

let io = null;

// Authoritative user presence: Map<userId: number, Set<socketId: string>>
const userSockets = new Map();
// Disconnect grace period timeouts: Map<userId: number, NodeJS.Timeout>
const disconnectTimeouts = new Map();
const GRACE_PERIOD_MS = 25000;

/**
 * Set the global Socket.IO instance
 */
function setIO(ioInstance) {
  io = ioInstance;
}

/**
 * Get the global Socket.IO instance
 */
function getIO() {
  return io;
}

/**
 * Register a user socket connection
 * Cancels any active disconnect grace timeout.
 * Broadcasts users:online-update if this user was not already online.
 */
function registerUserSocket(userId, socketId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId) || !socketId) return;

  // Cancel any pending disconnect grace timeout
  if (disconnectTimeouts.has(numericId)) {
    clearTimeout(disconnectTimeouts.get(numericId));
    disconnectTimeouts.delete(numericId);
  }

  const wasOnline = isUserOnline(numericId);

  if (!userSockets.has(numericId)) {
    userSockets.set(numericId, new Set());
  }
  userSockets.get(numericId).add(socketId);

  if (!wasOnline) {
    broadcastOnlineUsers();
  }
}

/**
 * Unregister a user socket disconnection
 * If all sockets for this user are gone, starts a 25s grace timeout before marking offline.
 */
function unregisterUserSocket(userId, socketId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId)) return;

  const sockets = userSockets.get(numericId);
  if (sockets && socketId) {
    sockets.delete(socketId);
  }

  // If no remaining active sockets, start grace period
  if (!sockets || sockets.size === 0) {
    if (disconnectTimeouts.has(numericId)) {
      clearTimeout(disconnectTimeouts.get(numericId));
    }

    const timeout = setTimeout(() => {
      disconnectTimeouts.delete(numericId);
      const currentSockets = userSockets.get(numericId);
      if (!currentSockets || currentSockets.size === 0) {
        userSockets.delete(numericId);
        broadcastOnlineUsers();
      }
    }, GRACE_PERIOD_MS);

    disconnectTimeouts.set(numericId, timeout);
  }
}

/**
 * Backwards compatible wrappers
 */
function trackUserConnected(userId, socketId = "legacy") {
  registerUserSocket(userId, socketId);
}

function trackUserDisconnected(userId, socketId = "legacy") {
  unregisterUserSocket(userId, socketId);
}

/**
 * Check if a specific user is currently online (has active sockets or in grace period)
 */
function isUserOnline(userId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId)) return false;
  const sockets = userSockets.get(numericId);
  if (sockets && sockets.size > 0) return true;
  return disconnectTimeouts.has(numericId);
}

/**
 * Get active socket count for a specific user
 */
function getUserSocketCount(userId) {
  const numericId = parseInt(userId, 10);
  if (isNaN(numericId)) return 0;
  return userSockets.get(numericId)?.size || 0;
}

/**
 * Get list of currently online user IDs
 */
function getOnlineUserIds() {
  const online = new Set();
  for (const [uid, sockets] of userSockets.entries()) {
    if (sockets && sockets.size > 0) {
      online.add(uid);
    }
  }
  for (const uid of disconnectTimeouts.keys()) {
    online.add(uid);
  }
  return Array.from(online);
}

function formatFriendlyName(name, email, id) {
  if (name && !name.startsWith("Player ") && !name.startsWith("Player #") && name !== "Chess Player") {
    return name;
  }
  if (email && email.includes("@") && !email.includes("local")) {
    const userPart = email.split("@")[0].replace(/[._-]/g, " ");
    return userPart.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  }
  return name || `Player ${id}`;
}

/**
 * Get detailed profiles of all currently online users
 */
function getOnlineUsersDetailed() {
  const onlineIds = getOnlineUserIds();
  const detailed = [];
  for (const id of onlineIds) {
    const user = userStore.getUser(id);
    if (user) {
      detailed.push({
        id: user.id,
        name: formatFriendlyName(user.name, user.email, user.id),
        email: user.email || null,
        avatarUrl: user.avatarUrl || null,
        role: user.role || "STUDENT",
        rating: user.rating || 1200,
        isOnline: true,
      });
    }
  }
  return detailed;
}

/**
 * Broadcast current online user list to all clients
 */
function broadcastOnlineUsers() {
  if (!io) return;
  const onlineIds = getOnlineUserIds();
  const onlineUsers = getOnlineUsersDetailed();
  io.emit("users:online-update", {
    onlineUserIds: onlineIds,
    onlineUsers,
  });
}

/**
 * Broadcast an event to a game room
 * @param {string|number} gameId
 * @param {string} event
 * @param {object} payload
 */
function emitToGame(gameId, event, payload) {
  if (!io) return;
  io.to(`game:${gameId}`).emit(event, payload);
}

/**
 * Send an event to a specific user room
 * @param {string|number} userId
 * @param {string} event
 * @param {object} payload
 */
function emitToUser(userId, event, payload) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}

/**
 * Broadcast an event to a tournament room
 * @param {string|number} tournamentId
 * @param {string} event
 * @param {object} payload
 */
function emitToTournament(tournamentId, event, payload) {
  if (!io) return;
  io.to(`tournament:${tournamentId}`).emit(event, payload);
}

module.exports = {
  setIO,
  getIO,
  registerUserSocket,
  unregisterUserSocket,
  trackUserConnected,
  trackUserDisconnected,
  getOnlineUserIds,
  getOnlineUsersDetailed,
  isUserOnline,
  getUserSocketCount,
  broadcastOnlineUsers,
  emitToGame,
  emitToUser,
  emitToTournament,
};
