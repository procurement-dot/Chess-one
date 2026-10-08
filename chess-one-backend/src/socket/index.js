const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const {
  setIO,
  trackUserConnected,
  trackUserDisconnected,
  broadcastOnlineUsers,
  getOnlineUserIds,
} = require("../config/socket");
const { registerGameHandlers } = require("./game.socket");

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

  // Socket authentication middleware using ChessOne JWT
  io.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (token) {
        try {
          const decoded = verifyToken(token);
          const userId = decoded.userId || decoded.id;
          socket.data.user = { id: userId, email: decoded.email };
          socket.userId = userId;
        } catch (err) {
          // Token invalid, still allow connection with guest/fallback
        }
      }

      // Check fallback userId in handshake
      if (!socket.userId && socket.handshake.auth?.userId) {
        const fallbackId = parseInt(socket.handshake.auth.userId, 10);
        socket.data.user = { id: fallbackId };
        socket.userId = fallbackId;
      }

      next();
    } catch (err) {
      next();
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId || socket.data?.user?.id;

    // Join private user room for notifications and track online state
    if (userId) {
      socket.join(`user:${userId}`);
      trackUserConnected(userId);
      broadcastOnlineUsers();

      // Immediately send current online list to connecting user
      socket.emit("users:online-update", { onlineUserIds: getOnlineUserIds() });

      socket.on("disconnect", () => {
        trackUserDisconnected(userId);
        broadcastOnlineUsers();
      });
    }

    // Register live chess game room handlers
    registerGameHandlers(io, socket);
  });

  return io;
}

module.exports = {
  initializeSocket,
};
