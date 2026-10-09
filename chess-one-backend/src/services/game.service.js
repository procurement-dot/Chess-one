const prisma = require("../config/database");
const { generateGameCode } = require("../utils/game-code");
const { STARTING_FEN } = require("../utils/chess");
const { parseTimeControl, getLiveTimes } = require("./clock.service");
const { determineResult } = require("./result.service");
const { emitToGame } = require("../config/socket");
const { AppError } = require("../middleware/error.middleware");

class GameService {
  /**
   * Helper to resolve game by integer ID or string gameCode
   */
  async findGameByIdOrCode(identifier, include = {}) {
    const isNum = !isNaN(identifier) && !isNaN(parseInt(identifier, 10));
    const where = isNum
      ? { id: parseInt(identifier, 10) }
      : { gameCode: identifier.toString().toUpperCase() };

    const game = await prisma.game.findFirst({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        whitePlayer: { select: { id: true, name: true, email: true } },
        blackPlayer: { select: { id: true, name: true, email: true } },
        winner: { select: { id: true, name: true, email: true } },
        ...include,
      },
    });

    if (!game) {
      throw new AppError("GAME_NOT_FOUND", "Game not found", 404);
    }

    return game;
  }

  /**
   * Create a new chess game (PvP or PvAI)
   */
  async createGame({ userId, gameType, timeControl, colorPreference = "RANDOM", aiDifficulty = "MEDIUM" }) {
    // Validate time control format
    const { initialTimeMs } = parseTimeControl(timeControl);

    // Generate unique game code
    let gameCode = generateGameCode();
    while (await prisma.game.findUnique({ where: { gameCode } })) {
      gameCode = generateGameCode();
    }

    // Determine assigned colors
    let whitePlayerId = null;
    let blackPlayerId = null;

    let assignedColor = colorPreference;
    if (colorPreference === "RANDOM") {
      assignedColor = Math.random() < 0.5 ? "WHITE" : "BLACK";
    }

    if (assignedColor === "WHITE") {
      whitePlayerId = userId;
    } else {
      blackPlayerId = userId;
    }

    if (gameType === "PLAYER_VS_AI") {
      const game = await prisma.game.create({
        data: {
          gameCode,
          gameType: "PLAYER_VS_AI",
          status: "ACTIVE",
          createdBy: userId,
          whitePlayerId,
          blackPlayerId,
          aiDifficulty,
          timeControl,
          whiteTimeMs: initialTimeMs,
          blackTimeMs: initialTimeMs,
          fen: STARTING_FEN,
          pgn: "",
          currentTurn: "WHITE",
          startedAt: new Date(),
          lastMoveAt: !whitePlayerId ? new Date() : null,
        },
      });

      // If AI is playing as White, schedule AI's opening move immediately
      if (!whitePlayerId) {
        const moveService = require("./move.service");
        moveService._scheduleAIMove(game.id, aiDifficulty);
      }

      return {
        gameId: game.id,
        gameCode: game.gameCode,
        gameType: game.gameType,
        status: game.status,
        playerColor: assignedColor,
        aiDifficulty: game.aiDifficulty,
        timeControl: game.timeControl,
      };
    }

    // PLAYER_VS_PLAYER: Game waits for opponent
    const game = await prisma.game.create({
      data: {
        gameCode,
        gameType: "PLAYER_VS_PLAYER",
        status: "WAITING",
        createdBy: userId,
        whitePlayerId,
        blackPlayerId,
        timeControl,
        whiteTimeMs: initialTimeMs,
        blackTimeMs: initialTimeMs,
        fen: STARTING_FEN,
        pgn: "",
        currentTurn: "WHITE",
      },
    });

    return {
      gameId: game.id,
      gameCode: game.gameCode,
      gameType: game.gameType,
      status: game.status,
      playerColor: assignedColor,
      timeControl: game.timeControl,
    };
  }

  /**
   * Get basic game details
   */
  async getGame(gameId) {
    const game = await this.findGameByIdOrCode(gameId);

    return {
      id: game.id,
      gameId: game.id,
      gameCode: game.gameCode,
      gameType: game.gameType,
      status: game.status,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      creator: game.creator,
      whitePlayer: game.whitePlayer,
      blackPlayer: game.blackPlayer,
      timeControl: game.timeControl,
      aiDifficulty: game.aiDifficulty,
      currentTurn: game.currentTurn,
      result: game.result,
      winnerId: game.winnerId,
      winner: game.winner,
      createdAt: game.createdAt,
      startedAt: game.startedAt,
      finishedAt: game.finishedAt,
    };
  }

  /**
   * Join a waiting game directly using gameId or gameCode
   */
  async joinGame({ gameId, userId }) {
    const game = await this.findGameByIdOrCode(gameId);

    // If user is already in the game, return current game info
    if (game.whitePlayerId === userId || game.blackPlayerId === userId) {
      return {
        gameId: game.id,
        gameCode: game.gameCode,
        status: game.status,
        playerColor: game.whitePlayerId === userId ? "WHITE" : "BLACK",
      };
    }

    if (game.status !== "WAITING") {
      throw new AppError("GAME_ALREADY_STARTED", "Game is no longer waiting for players", 400);
    }

    if (game.createdBy === userId) {
      throw new AppError("ALREADY_CREATOR", "You cannot join your own game as an opponent", 400);
    }

    let whitePlayerId = game.whitePlayerId;
    let blackPlayerId = game.blackPlayerId;
    let joiningPlayerColor = "BLACK";

    if (whitePlayerId && !blackPlayerId) {
      blackPlayerId = userId;
      joiningPlayerColor = "BLACK";
    } else if (blackPlayerId && !whitePlayerId) {
      whitePlayerId = userId;
      joiningPlayerColor = "WHITE";
    } else {
      whitePlayerId = game.createdBy;
      blackPlayerId = userId;
      joiningPlayerColor = "BLACK";
    }

    const { initialTimeMs } = parseTimeControl(game.timeControl);
    const now = new Date();

    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "ACTIVE",
        whitePlayerId,
        blackPlayerId,
        whiteTimeMs: initialTimeMs,
        blackTimeMs: initialTimeMs,
        startedAt: now,
        lastMoveAt: now,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        whitePlayer: { select: { id: true, name: true, email: true } },
        blackPlayer: { select: { id: true, name: true, email: true } },
      },
    });

    const payload = {
      gameId: updatedGame.id,
      gameCode: updatedGame.gameCode,
      status: updatedGame.status,
      playerColor: joiningPlayerColor,
      whitePlayer: updatedGame.whitePlayer,
      blackPlayer: updatedGame.blackPlayer,
      timeControl: updatedGame.timeControl,
      fen: updatedGame.fen,
      currentTurn: updatedGame.currentTurn,
    };

    emitToGame(updatedGame.id, "game:started", payload);
    return payload;
  }

  /**
   * Get live game state with clocks (authoritative for reconnection)
   */
  async getGameState(gameId) {
    const game = await this.findGameByIdOrCode(gameId, {
      moves: { select: { id: true, moveNumber: true }, orderBy: { id: "desc" } },
    });

    // Calculate live clocks and check for timeout
    const liveTimes = getLiveTimes(game);

    if (liveTimes.isTimedOut && game.status === "ACTIVE") {
      // Game timed out during inactivity
      const timeoutResult = determineResult({
        reason: "TIMEOUT",
        game,
        movingPlayerColor: liveTimes.timedOutColor,
      });

      const updated = await prisma.game.update({
        where: { id: game.id },
        data: {
          status: timeoutResult.status,
          result: timeoutResult.result,
          winnerId: timeoutResult.winnerId,
          finishedAt: timeoutResult.finishedAt,
          whiteTimeMs: liveTimes.whiteTimeMs,
          blackTimeMs: liveTimes.blackTimeMs,
        },
      });

      emitToGame(game.id, "game:finished", {
        gameId: game.id,
        gameCode: game.gameCode,
        result: updated.result,
        winnerId: updated.winnerId,
      });

      return {
        gameId: updated.id,
        gameCode: updated.gameCode,
        status: updated.status,
        fen: updated.fen,
        currentTurn: updated.currentTurn,
        whiteTimeMs: updated.whiteTimeMs,
        blackTimeMs: updated.blackTimeMs,
        lastMoveAt: updated.lastMoveAt,
        result: updated.result,
        winnerId: updated.winnerId,
        drawOfferFrom: updated.drawOfferFrom,
        moveCount: game.moves ? game.moves.length : 0,
        lastMoveNumber: (game.moves && game.moves.length > 0) ? game.moves[0].moveNumber : 0,
      };
    }

    // Auto-trigger AI move if it's currently AI's turn in an active match
    if (
      game.gameType === "PLAYER_VS_AI" &&
      game.status === "ACTIVE" &&
      ((game.currentTurn === "WHITE" && !game.whitePlayerId) ||
        (game.currentTurn === "BLACK" && !game.blackPlayerId))
    ) {
      const moveService = require("./move.service");
      moveService._scheduleAIMove(game.id, game.aiDifficulty);
    }

    return {
      gameId: game.id,
      gameCode: game.gameCode,
      status: game.status,
      fen: game.fen,
      currentTurn: game.currentTurn,
      whiteTimeMs: liveTimes.whiteTimeMs,
      blackTimeMs: liveTimes.blackTimeMs,
      lastMoveAt: game.lastMoveAt,
      result: game.result,
      winnerId: game.winnerId,
      drawOfferFrom: game.drawOfferFrom,
      moveCount: game.moves ? game.moves.length : 0,
      lastMoveNumber: (game.moves && game.moves.length > 0) ? game.moves[0].moveNumber : 0,
    };
  }

  /**
   * Cancel a waiting game (Creator only)
   */
  async cancelWaitingGame({ gameId, userId }) {
    const game = await this.findGameByIdOrCode(gameId);

    if (game.createdBy !== userId) {
      throw new AppError("FORBIDDEN", "Only the game creator can cancel the game", 403);
    }

    if (game.status !== "WAITING") {
      throw new AppError("GAME_ALREADY_STARTED", "Cannot cancel a game that is no longer waiting", 400);
    }

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: { status: "CANCELLED" },
    });

    emitToGame(game.id, "game:cancelled", {
      gameId: game.id,
      gameCode: game.gameCode,
    });

    return {
      gameId: updated.id,
      status: updated.status,
    };
  }

  /**
   * Abort game (first move timeout or disconnect)
   */
  async abortGame({ gameId, userId, reason = "FIRST_MOVE_TIMEOUT" }) {
    const game = await this.findGameByIdOrCode(gameId);

    if (game.status === "COMPLETED" || game.status === "CANCELLED") {
      return { gameId: game.id, status: game.status, alreadyFinished: true };
    }

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "CANCELLED",
        finishedAt: new Date(),
      },
    });

    const payload = {
      gameId: game.id,
      gameCode: game.gameCode,
      status: "CANCELLED",
      abortedBy: userId || null,
      reason,
    };

    emitToGame(game.id, "game:aborted", payload);
    emitToGame(game.id, "game:cancelled", payload);

    return payload;
  }

  /**
   * Resign an active game
   */
  async resignGame({ gameId, userId }) {
    const game = await this.findGameByIdOrCode(gameId);

    if (game.status !== "ACTIVE") {
      throw new AppError("GAME_NOT_ACTIVE", "Can only resign an active game", 400);
    }

    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new AppError("NOT_A_PLAYER", "You are not a player in this game", 403);
    }

    const resigningColor = isWhite ? "WHITE" : "BLACK";
    const resultData = determineResult({
      reason: "RESIGNATION",
      game,
      movingPlayerColor: resigningColor,
    });

    const updated = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: resultData.status,
        result: resultData.result,
        winnerId: resultData.winnerId,
        finishedAt: resultData.finishedAt,
      },
    });

    const payload = {
      gameId: game.id,
      gameCode: game.gameCode,
      result: updated.result,
      resignedBy: userId,
      winnerId: updated.winnerId,
    };

    emitToGame(game.id, "game:resigned", payload);
    emitToGame(game.id, "game:finished", payload);

    return payload;
  }

  /**
   * Offer a draw
   */
  async offerDraw({ gameId, userId }) {
    const game = await this.findGameByIdOrCode(gameId);

    if (game.status !== "ACTIVE") {
      throw new AppError("GAME_NOT_ACTIVE", "Cannot offer draw in an inactive game", 400);
    }

    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new AppError("NOT_A_PLAYER", "You are not a player in this game", 403);
    }

    const playerColor = isWhite ? "WHITE" : "BLACK";

    if (game.drawOfferFrom) {
      throw new AppError("DRAW_OFFER_EXISTS", "A draw offer is already pending", 400);
    }

    await prisma.game.update({
      where: { id: game.id },
      data: { drawOfferFrom: playerColor },
    });

    const payload = {
      gameId: game.id,
      offeredByColor: playerColor,
      offeredByUserId: userId,
    };

    emitToGame(game.id, "game:draw-offered", payload);

    return payload;
  }

  /**
   * Respond to a draw offer (accept or reject)
   */
  async respondDraw({ gameId, userId, accept }) {
    const game = await this.findGameByIdOrCode(gameId);

    if (game.status !== "ACTIVE") {
      throw new AppError("GAME_NOT_ACTIVE", "Game is not active", 400);
    }

    if (!game.drawOfferFrom) {
      throw new AppError("NO_DRAW_OFFER", "No draw offer exists to respond to", 400);
    }

    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new AppError("NOT_A_PLAYER", "You are not a player in this game", 403);
    }

    const responderColor = isWhite ? "WHITE" : "BLACK";

    if (game.drawOfferFrom === responderColor) {
      throw new AppError("CANNOT_ACCEPT_OWN_DRAW", "You cannot respond to your own draw offer", 400);
    }

    if (accept) {
      const updated = await prisma.game.update({
        where: { id: game.id },
        data: {
          status: "COMPLETED",
          result: "DRAW",
          drawOfferFrom: null,
          finishedAt: new Date(),
        },
      });

      const payload = {
        gameId: game.id,
        gameCode: game.gameCode,
        result: "DRAW",
        winnerId: null,
      };

      emitToGame(game.id, "game:draw-accepted", payload);
      emitToGame(game.id, "game:finished", payload);

      return payload;
    } else {
      await prisma.game.update({
        where: { id: game.id },
        data: { drawOfferFrom: null },
      });

      const payload = {
        gameId: game.id,
        rejectedByUserId: userId,
      };

      emitToGame(game.id, "game:draw-rejected", payload);

      return payload;
    }
  }

  /**
   * Get moves of a game
   */
  async getGameMoves(gameId) {
    const game = await this.findGameByIdOrCode(gameId);

    const moves = await prisma.gameMove.findMany({
      where: { gameId: game.id },
      orderBy: { id: "asc" },
      select: {
        id: true,
        moveNumber: true,
        color: true,
        from: true,
        to: true,
        promotion: true,
        san: true,
        createdAt: true,
      },
    });

    return moves;
  }

  /**
   * Get game PGN
   */
  async getGamePgn(gameId) {
    const game = await this.findGameByIdOrCode(gameId);
    return {
      gameId: game.id,
      gameCode: game.gameCode,
      pgn: game.pgn || "",
    };
  }

  /**
   * Get game final result
   */
  async getGameResult(gameId) {
    const game = await this.findGameByIdOrCode(gameId);

    let winner = null;
    let loser = null;

    if (game.winnerId) {
      if (game.whitePlayerId === game.winnerId) {
        winner = game.whitePlayer;
        loser = game.blackPlayer;
      } else {
        winner = game.blackPlayer;
        loser = game.whitePlayer;
      }
    }

    return {
      game: {
        id: game.id,
        gameCode: game.gameCode,
        gameType: game.gameType,
        status: game.status,
        winnerId: game.winnerId,
        whitePlayerId: game.whitePlayerId,
        blackPlayerId: game.blackPlayerId,
        whitePlayer: game.whitePlayer,
        blackPlayer: game.blackPlayer,
      },
      winnerId: game.winnerId,
      whitePlayerId: game.whitePlayerId,
      blackPlayerId: game.blackPlayerId,
      players: {
        white: game.whitePlayer,
        black: game.blackPlayer,
      },
      result: game.result,
      winner,
      loser,
      finalFen: game.fen,
      pgn: game.pgn,
      finishedAt: game.finishedAt,
    };
  }

  /**
   * Get games for authenticated user
   */
  async getMyGames({ userId, status, gameType, page = 1, limit = 20 }) {
    const take = parseInt(limit, 10);
    const skip = (parseInt(page, 10) - 1) * take;

    const where = {
      OR: [
        { whitePlayerId: userId },
        { blackPlayerId: userId },
        { createdBy: userId },
      ],
    };

    if (status) {
      where.status = status;
    }

    if (gameType) {
      where.gameType = gameType;
    }

    const [total, games] = await Promise.all([
      prisma.game.count({ where }),
      prisma.game.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          whitePlayer: { select: { id: true, name: true } },
          blackPlayer: { select: { id: true, name: true } },
          winner: { select: { id: true, name: true } },
        },
      }),
    ]);

    return {
      games,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }
}

module.exports = new GameService();
