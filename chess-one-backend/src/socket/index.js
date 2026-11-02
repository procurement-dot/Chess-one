const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/database");
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

  // Socket authentication middleware using ChessOne JWT [Security fix S2]
  io.use(async (socket, next) => {
    try {
      let token = socket.handshake.auth?.token;
      if (!token) {
        const authHeader = socket.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.replace("Bearer ", "").trim();
        }
      }

      if (!token) {
        return next(new Error("UNAUTHORIZED"));
      }

      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        return next(new Error("UNAUTHORIZED"));
      }

      const userId = decoded.userId || decoded.id;
      if (!userId) {
        return next(new Error("UNAUTHORIZED"));
      }

      // Load user from database by token userId
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: { id: true, name: true, role: true },
      });

      if (!user) {
        return next(new Error("UNAUTHORIZED"));
      }

      // Set socket.data properties
      socket.data.userId = user.id;
      socket.data.user = {
        id: user.id,
        name: user.name,
        role: user.role,
      };

      next();
    } catch (err) {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data?.userId;

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
