const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const {
  setIO,
  registerUserSocket,
  unregisterUserSocket,
  getOnlineUserIds,
  getOnlineUsersDetailed,
} = require("../config/socket");
const { registerGameHandlers } = require("./game.socket");
const { registerTournamentHandlers } = require("./tournament.socket");
const userStore = require("../store/user.store");

/**
 * Initialize Socket.IO with HTTP server
 */
function initializeSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: "*", // Allows mobile emulator and dev clients
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  // Store global IO reference for services
  setIO(io);

  // Socket authentication middleware using ChessOne JWT ONLY
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token && typeof token === "string") {
        try {
          const decoded = verifyToken(token);
          const userId = parseInt(decoded.userId || decoded.id, 10);
          if (!isNaN(userId)) {
            socket.userId = userId;
            socket.data.user = {
              id: userId,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role,
              avatarUrl: decoded.avatarUrl,
            };
            userStore.upsertUser(socket.data.user);
          } else {
            socket.authError = { code: "INVALID_TOKEN", message: "Invalid user ID in token" };
          }
        } catch {
          socket.authError = { code: "INVALID_TOKEN", message: "Token verification failed" };
        }
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    const transport = socket.conn?.transport?.name || "unknown";
    console.log(`[Socket:connect] id=${socket.id} transport=${transport} userId=${socket.userId || 'anon'}`);

    socket.conn?.on("upgrade", (upgradedTransport) => {
      console.log(`[Socket:upgrade] id=${socket.id} transport upgraded to ${upgradedTransport.name}`);
    });

    if (socket.authError) {
      socket.emit("auth:error", socket.authError);
    }

    if (socket.userId) {
      registerUserSocket(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
    }

    // Immediately send current online list with user details to connecting client
    socket.emit("users:online-update", {
      onlineUserIds: getOnlineUserIds(),
      onlineUsers: getOnlineUsersDetailed(),
    });

    // Allow dynamic authentication after socket connects
    socket.on("auth:authenticate", (data) => {
      try {
        const token = data?.token || (typeof data === "string" ? data : null);
        if (!token) {
          socket.emit("auth:error", { code: "INVALID_TOKEN", message: "Token is required" });
          return;
        }

        const decoded = verifyToken(token);
        const userId = parseInt(decoded.userId || decoded.id, 10);
        if (isNaN(userId)) {
          socket.emit("auth:error", { code: "INVALID_TOKEN", message: "Invalid user ID in token" });
          return;
        }

        if (socket.userId && socket.userId !== userId) {
          unregisterUserSocket(socket.userId, socket.id);
          socket.leave(`user:${socket.userId}`);
        }

        socket.userId = userId;
        socket.data = socket.data || {};
        socket.data.user = {
          id: userId,
          email: decoded.email,
          name: decoded.name,
          role: decoded.role,
          avatarUrl: decoded.avatarUrl,
        };
        userStore.upsertUser(socket.data.user);

        registerUserSocket(userId, socket.id);
        socket.join(`user:${userId}`);

        const currentTransport = socket.conn?.transport?.name || transport;
        console.log(`[Socket:auth] id=${socket.id} transport=${currentTransport} userId=${userId}`);

        socket.emit("auth:authenticated", { success: true, user: socket.data.user });
      } catch (err) {
        socket.emit("auth:error", { code: "INVALID_TOKEN", message: "Invalid or expired token" });
      }
    });

    // Client heartbeat: refreshes presence and replies with online IDs and details
    socket.on("presence:ping", () => {
      if (socket.userId) {
        registerUserSocket(socket.userId, socket.id);
      }
      socket.emit("presence:pong", {
        onlineUserIds: getOnlineUserIds(),
        onlineUsers: getOnlineUsersDetailed(),
        timestamp: Date.now(),
      });
    });

    socket.on("disconnect", (reason) => {
      const currentTransport = socket.conn?.transport?.name || "unknown";
      console.log(`[Socket:disconnect] id=${socket.id} transport=${currentTransport} userId=${socket.userId || 'anon'} reason=${reason}`);
      if (socket.userId) {
        unregisterUserSocket(socket.userId, socket.id);
      }
    });

    // Register live chess game room handlers
    registerGameHandlers(io, socket);

    // Register tournament room handlers
    registerTournamentHandlers(io, socket);
  });

  return io;
}

module.exports = {
  initializeSocket,
};
