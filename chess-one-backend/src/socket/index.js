const { Server } = require("socket.io");
const { verifyToken } = require("../utils/jwt");
const prisma = require("../config/database");
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
      let token = socket.handshake.auth?.token;
      if (!token) {
        const authHeader = socket.handshake.headers?.authorization;
        if (authHeader && authHeader.startsWith("Bearer ")) {
          token = authHeader.replace("Bearer ", "").trim();
        }
      }

      if (token && typeof token === "string") {
        try {
          const decoded = verifyToken(token);
          const userId = parseInt(decoded.userId || decoded.id, 10);
          if (!isNaN(userId)) {
            socket.userId = userId;

            const handshakeName = socket.handshake.auth?.name;
            const handshakeEmail = socket.handshake.auth?.email;
            const handshakeAvatar = socket.handshake.auth?.avatarUrl;

            let resolvedName =
              handshakeName && !handshakeName.startsWith("Player")
                ? handshakeName.trim()
                : decoded.name && !decoded.name.startsWith("Player")
                ? decoded.name.trim()
                : null;

            const resolvedEmail = handshakeEmail || decoded.email;
            if (!resolvedName && resolvedEmail && resolvedEmail.includes("@") && !resolvedEmail.includes("local")) {
              const prefix = resolvedEmail.split("@")[0].replace(/[._-]/g, " ");
              resolvedName = prefix.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
            }

            socket.data.user = {
              id: userId,
              email: resolvedEmail,
              name: resolvedName || `Player ${userId}`,
              role: decoded.role || "STUDENT",
              avatarUrl: handshakeAvatar || decoded.avatarUrl || null,
            };
            userStore.upsertUser(socket.data.user);
          }
        } catch {
          // Token in handshake failed verification - leave socket as anonymous
        }
      }

      next();
    } catch (err) {
      next(new Error("UNAUTHORIZED"));
    }
  });

  io.on("connection", (socket) => {
    const transport = socket.conn?.transport?.name || "unknown";
    console.log(`[Socket:connect] id=${socket.id} transport=${transport} userId=${socket.userId || 'anon'}`);

    socket.conn?.on("upgrade", (upgradedTransport) => {
      console.log(`[Socket:upgrade] id=${socket.id} transport upgraded to ${upgradedTransport.name}`);
    });

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

        const clientName = data?.name || data?.user?.name;
        const clientEmail = data?.email || data?.user?.email;
        const clientAvatar = data?.avatarUrl || data?.user?.photo || data?.user?.avatarUrl;

        let resolvedName =
          clientName && !clientName.startsWith("Player")
            ? clientName.trim()
            : decoded.name && !decoded.name.startsWith("Player")
            ? decoded.name.trim()
            : null;

        const resolvedEmail = clientEmail || decoded.email;
        if (!resolvedName && resolvedEmail && resolvedEmail.includes("@") && !resolvedEmail.includes("local")) {
          const prefix = resolvedEmail.split("@")[0].replace(/[._-]/g, " ");
          resolvedName = prefix.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
        }

        socket.data.user = {
          id: userId,
          email: resolvedEmail,
          name: resolvedName || `Player ${userId}`,
          role: decoded.role || "STUDENT",
          avatarUrl: clientAvatar || decoded.avatarUrl || null,
        };
        userStore.upsertUser(socket.data.user);

        registerUserSocket(userId, socket.id);
        socket.join(`user:${userId}`);

        const currentTransport = socket.conn?.transport?.name || transport;
        console.log(`[Socket:auth] id=${socket.id} transport=${currentTransport} userId=${userId} name=${socket.data.user.name}`);

        socket.emit("auth:authenticated", { success: true, user: socket.data.user });
        broadcastOnlineUsers();
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
