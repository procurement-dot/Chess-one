const prisma = require("../config/database");

/**
 * Register game-related socket handlers
 */
function registerGameHandlers(io, socket) {
  const currentRooms = new Set();

  /**
   * Client joins a live game room
   * Payload: { gameId: 1 } or { gameId: "ABC123" }
   */
  socket.on("game:join", async (payload = {}) => {
    try {
      const { gameId } = payload;
      if (!gameId) return;

      const isNum = !isNaN(gameId) && !isNaN(parseInt(gameId, 10));
      const where = isNum
        ? { id: parseInt(gameId, 10) }
        : { gameCode: gameId.toString().toUpperCase() };

      const game = await prisma.game.findFirst({ where });
      if (!game) {
        socket.emit("error", { code: "GAME_NOT_FOUND", message: "Game not found" });
        return;
      }

      const roomName = `game:${game.id}`;
      socket.join(roomName);
      currentRooms.add(roomName);

      // Join gameCode room as well for client convenience
      if (game.gameCode) {
        socket.join(`game:${game.gameCode}`);
        currentRooms.add(`game:${game.gameCode}`);
      }

      const userId = socket.data?.user?.id;
      const isPlayer =
        userId && (game.whitePlayerId === userId || game.blackPlayerId === userId);

      if (isPlayer) {
        // Broadcast reconnection to room
        socket.to(roomName).emit("game:player-reconnected", {
          gameId: game.id,
          gameCode: game.gameCode,
          userId,
          socketId: socket.id,
        });
      }

      socket.emit("game:joined", {
        gameId: game.id,
        gameCode: game.gameCode,
        room: roomName,
      });
    } catch (err) {
      console.error("Socket game:join error:", err);
    }
  });

  /**
   * Real-time game move via socket
   * Payload: { gameId, from, to, promotion }
   */
  socket.on("game:move", async (payload = {}) => {
    try {
      const { gameId, from, to, promotion } = payload;
      if (!gameId || !from || !to) return;
      const moveService = require("../services/move.service");
      const userId = socket.data?.user?.id || socket.userId;
      if (!userId) return;
      await moveService.makeMove({
        gameId,
        userId,
        from,
        to,
        promotion,
      });
    } catch (err) {
      console.warn("Socket game:move error:", err.message);
      socket.emit("game:move-error", { message: err.message });
    }
  });

  /**
   * Real-time game abort (first move timeout or disconnect)
   * Payload: { gameId, reason }
   */
  socket.on("game:abort", async (payload = {}) => {
    try {
      const { gameId, reason } = payload;
      if (!gameId) return;
      const gameService = require("../services/game.service");
      const userId = socket.data?.user?.id || socket.userId;
      await gameService.abortGame({ gameId, userId, reason });
    } catch (err) {
      console.error("Socket game:abort error:", err);
    }
  });

  /**
   * Real-time in-game chat between players
   * Payload: { gameId, text }
   */
  socket.on("game:chat", async (payload = {}) => {
    try {
      const { gameId, text, senderName: clientSenderName, senderId: clientSenderId } = payload;
      if (!gameId || !text || typeof text !== "string") return;

      const trimmed = text.trim().slice(0, 300);
      if (!trimmed) return;

      const userId = socket.data?.user?.id || socket.userId || clientSenderId;
      let senderName = clientSenderName || "Player";
      if (userId) {
        try {
          const user = await prisma.user.findUnique({
            where: { id: parseInt(userId, 10) },
            select: { id: true, name: true, email: true },
          });
          if (user) {
            senderName = user.name || user.email?.split("@")[0] || senderName;
          }
        } catch {}
      }

      const chatMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gameId,
        senderId: userId ? parseInt(userId, 10) : null,
        senderName,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };

      // Broadcast to live game room
      io.to(`game:${gameId}`).emit("game:chat-message", chatMessage);
      if (typeof gameId === "string" && !isNaN(parseInt(gameId, 10))) {
        io.to(`game:${parseInt(gameId, 10)}`).emit("game:chat-message", chatMessage);
      } else if (typeof gameId === "number") {
        io.to(`game:${gameId.toString()}`).emit("game:chat-message", chatMessage);
      }
    } catch (err) {
      console.error("Socket game:chat error:", err);
    }
  });

  /**
   * Handle socket disconnection
   */
  socket.on("disconnect", () => {
    const userId = socket.data?.user?.id;
    for (const room of currentRooms) {
      socket.to(room).emit("game:player-disconnected", {
        room,
        userId,
        socketId: socket.id,
      });
    }
    currentRooms.clear();
  });
}

module.exports = {
  registerGameHandlers,
};
