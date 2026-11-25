const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const {
  setIO,
  registerUserSocket,
  unregisterUserSocket,
  getOnlineUserIds,
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
    pingInterval: 10000,
    pingTimeout: 5000,
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
          }
        } catch {
          // Unverified token: leave socket unauthenticated (spectator mode)
        }
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    if (socket.userId) {
      registerUserSocket(socket.userId, socket.id);
      socket.join(`user:${socket.userId}`);
    }

    // Immediately send current online list to connecting client
    socket.emit("users:online-update", { onlineUserIds: getOnlineUserIds() });

    // Allow dynamic authentication after socket connects
    socket.on("auth:authenticate", (data) => {
      try {
        const token = data?.token || (typeof data === "string" ? data : null);
        if (!token) return;

        const decoded = verifyToken(token);
        const userId = parseInt(decoded.userId || decoded.id, 10);
        if (isNaN(userId)) return;

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

        socket.emit("auth:authenticated", { success: true, user: socket.data.user });
      } catch (err) {
        // Invalid token attempt
        socket.emit("auth:error", { message: "Invalid or expired token" });
      }
    });

    socket.on("disconnect", () => {
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
