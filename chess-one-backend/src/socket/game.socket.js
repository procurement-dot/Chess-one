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

      const gameService = require("../services/game.service");
      let game = null;
      try {
        game = await gameService.findGameByIdOrCode(gameId);
      } catch (err) {
        // Fallback check
        const isNum = !isNaN(gameId) && !isNaN(parseInt(gameId, 10));
        const where = isNum
          ? { id: parseInt(gameId, 10) }
          : { gameCode: gameId.toString().toUpperCase() };
        game = await prisma.game.findFirst({ where }).catch(() => null);
      }

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

      const userStore = require("../store/user.store");
      const clientUser = payload.user;
      let currentUser = socket.data?.user || clientUser;
      let currentUid = currentUser?.id ? parseInt(currentUser.id, 10) : (socket.userId || null);
      const requestedColor = payload.color;

      if (currentUid && (!currentUser || !currentUser.name)) {
        currentUser = userStore.getUser(currentUid) || currentUser;
      }
      if (currentUser?.email && (!currentUser || !currentUser.name)) {
        currentUser = userStore.getUserByEmail(currentUser.email) || currentUser;
      }

      if (currentUser && currentUid && currentUser.name) {
        userStore.upsertUser({ id: currentUid, ...currentUser });

        // Purge dummy placeholder names
        if (game.whitePlayer?.name === "Nishigndha Karande" || game.whitePlayer?.name === "Aarav Sharma" || game.whitePlayer?.name?.startsWith("Player ")) {
          game.whitePlayer = null;
          game.whitePlayerId = null;
        }
        if (game.blackPlayer?.name === "Nishigndha Karande" || game.blackPlayer?.name === "Aarav Sharma" || game.blackPlayer?.name?.startsWith("Player ")) {
          game.blackPlayer = null;
          game.blackPlayerId = null;
        }

        const isUserWhite =
          game.whitePlayerId === currentUid ||
          (game.whitePlayer?.email && currentUser.email && game.whitePlayer.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (game.whitePlayer?.name && game.whitePlayer.name.toLowerCase() === currentUser.name.toLowerCase());

        const isUserBlack =
          game.blackPlayerId === currentUid ||
          (game.blackPlayer?.email && currentUser.email && game.blackPlayer.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (game.blackPlayer?.name && game.blackPlayer.name.toLowerCase() === currentUser.name.toLowerCase());

        if (requestedColor === "WHITE" || isUserWhite) {
          game.whitePlayerId = currentUid;
          game.whitePlayer = { ...currentUser, id: currentUid };
          if (isUserBlack || game.blackPlayerId === currentUid) {
            game.blackPlayerId = null;
            game.blackPlayer = null;
          }
        } else if (requestedColor === "BLACK" || isUserBlack) {
          game.blackPlayerId = currentUid;
          game.blackPlayer = { ...currentUser, id: currentUid };
          if (isUserWhite || game.whitePlayerId === currentUid) {
            game.whitePlayerId = null;
            game.whitePlayer = null;
          }
        } else {
          if (!game.whitePlayerId) {
            game.whitePlayerId = currentUid;
            game.whitePlayer = { ...currentUser, id: currentUid };
          } else if (!game.blackPlayerId && !isUserWhite) {
            game.blackPlayerId = currentUid;
            game.blackPlayer = { ...currentUser, id: currentUid };
          }
        }

        // Never allow both slots to be the same player
        if (
          game.whitePlayer &&
          game.blackPlayer &&
          (game.whitePlayerId === game.blackPlayerId ||
           (game.whitePlayer.email && game.blackPlayer.email && game.whitePlayer.email.toLowerCase() === game.blackPlayer.email.toLowerCase()) ||
           (game.whitePlayer.name && game.blackPlayer.name && game.whitePlayer.name.toLowerCase() === game.blackPlayer.name.toLowerCase()))
        ) {
          game.blackPlayer = null;
          game.blackPlayerId = null;
        }

        if (gameService.inMemoryGames) {
          gameService.inMemoryGames.set(game.id, game);
          if (game.gameCode) gameService.inMemoryGames.set(game.gameCode, game);
        }
      }

      // Refresh dynamic names from userStore
      if (game.whitePlayerId) {
        const w = userStore.getUser(game.whitePlayerId);
        if (w && w.name) game.whitePlayer = { ...w };
      }
      if (game.blackPlayerId) {
        const b = userStore.getUser(game.blackPlayerId);
        if (b && b.name) game.blackPlayer = { ...b };
      }

      const isPlayer =
        currentUid && (game.whitePlayerId === currentUid || game.blackPlayerId === currentUid);

      if (isPlayer) {
        socket.to(roomName).emit("game:player-reconnected", {
          gameId: game.id,
          gameCode: game.gameCode,
          userId: currentUid,
          socketId: socket.id,
        });
      }

      // Broadcast synchronized real player identities to both clients in the match!
      io.to(roomName).emit("game:players-updated", {
        gameId: game.id,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
      });

      socket.emit("game:joined", {
        gameId: game.id,
        gameCode: game.gameCode,
        room: roomName,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
      });
    } catch (err) {
      console.error("Socket game:join error:", err);
    }
  });

  /**
   * Real-time game abort (first move timeout or disconnect)
   * Payload: { gameId, reason }
   */
  /**
   * Real-time ultra-low-latency move execution over WebSocket
   * Payload: { gameId, from, to, promotion }
   */
  socket.on("game:move", async (payload = {}, callback) => {
    try {
      const { gameId, from, to, promotion } = payload;
      const userId = socket.data?.user?.id || socket.userId;
      if (!gameId || !from || !to) {
        if (typeof callback === "function") callback({ error: "Invalid move parameters" });
        return;
      }

      const moveService = require("../services/move.service");
      const result = await moveService.makeMove({
        gameId,
        userId,
        from,
        to,
        promotion,
      });

      if (typeof callback === "function") {
        callback({ success: true, result });
      }
    } catch (err) {
      console.error("Socket game:move error:", err);
      if (typeof callback === "function") {
        callback({ error: err.message || "Move failed" });
      }
      socket.emit("error", { code: err.code || "MOVE_ERROR", message: err.message });
    }
  });

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
