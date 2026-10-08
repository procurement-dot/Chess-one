const prisma = require("../config/database");
const { validateAndApplyMove } = require("../utils/chess");
const { processMoveClock } = require("./clock.service");
const { determineResult } = require("./result.service");
const { emitToGame } = require("../config/socket");
const { AppError } = require("../middleware/error.middleware");
const aiService = require("./ai.service");

// In-memory registry of pending AI moves to prevent race conditions and duplicate executions
const activeAiTimers = new Map();

class MoveService {
  /**
   * Authoritative move execution
   * Validates move legality, clocks, turn order, and persists atomically
   */
  async makeMove({ gameId, userId, from, to, promotion }) {
    // 1. Resolve game
    const isNum = !isNaN(gameId) && !isNaN(parseInt(gameId, 10));
    const where = isNum
      ? { id: parseInt(gameId, 10) }
      : { gameCode: gameId.toString().toUpperCase() };

    const game = await prisma.game.findFirst({
      where,
      include: {
        moves: { orderBy: { id: "desc" }, take: 1 },
      },
    });

    if (!game) {
      throw new AppError("GAME_NOT_FOUND", "Game not found", 404);
    }

    // 2. Verify game is ACTIVE
    if (game.status !== "ACTIVE") {
      throw new AppError("GAME_NOT_ACTIVE", `Game is ${game.status.toLowerCase()}`, 400);
    }

    // 3. Verify user belongs to the game
    const isWhite = game.whitePlayerId === userId;
    const isBlack = game.blackPlayerId === userId;

    if (!isWhite && !isBlack) {
      throw new AppError("NOT_A_PLAYER", "You are not a player in this game", 403);
    }

    const playerColor = isWhite ? "WHITE" : "BLACK";

    // 4. Verify turn
    if (game.currentTurn !== playerColor) {
      throw new AppError("NOT_YOUR_TURN", "It is not your turn", 400);
    }

    const moveTime = new Date();

    // 5. Authoritative clock check
    const clockResult = processMoveClock(game, playerColor, moveTime);

    if (clockResult.hasTimedOut) {
      // Player ran out of time
      const timeoutEnd = determineResult({
        reason: "TIMEOUT",
        game,
        movingPlayerColor: playerColor,
      });

      const updated = await prisma.game.update({
        where: { id: game.id },
        data: {
          status: timeoutEnd.status,
          result: timeoutEnd.result,
          winnerId: timeoutEnd.winnerId,
          finishedAt: timeoutEnd.finishedAt,
          whiteTimeMs: clockResult.newWhiteTimeMs,
          blackTimeMs: clockResult.newBlackTimeMs,
        },
      });

      emitToGame(game.id, "game:finished", {
        gameId: game.id,
        gameCode: game.gameCode,
        result: updated.result,
        winnerId: updated.winnerId,
      });

      throw new AppError("TIMEOUT", "Time expired before move was received", 400);
    }

    // 6. Validate move using chess.js
    const moveValidation = validateAndApplyMove(game.fen, { from, to, promotion }, game.pgn);

    if (!moveValidation.success) {
      throw new AppError("INVALID_MOVE", moveValidation.error || "Illegal chess move", 400);
    }

    const { moveDetails, chess } = moveValidation;

    // 7. Check endgame conditions
    let gameStatus = "ACTIVE";
    let gameResult = null;
    let winnerId = null;
    let finishedAt = null;

    if (moveDetails.isCheckmate) {
      const end = determineResult({ reason: "CHECKMATE", game, movingPlayerColor: playerColor });
      gameStatus = end.status;
      gameResult = end.result;
      winnerId = end.winnerId;
      finishedAt = end.finishedAt;
    } else if (moveDetails.isStalemate) {
      const end = determineResult({ reason: "STALEMATE", game, movingPlayerColor: playerColor });
      gameStatus = end.status;
      gameResult = end.result;
      finishedAt = end.finishedAt;
    } else if (moveDetails.isDraw) {
      const end = determineResult({ reason: "DRAW", game, movingPlayerColor: playerColor });
      gameStatus = end.status;
      gameResult = end.result;
      finishedAt = end.finishedAt;
    }

    // 8. Next turn and move number
    const nextTurn = playerColor === "WHITE" ? "BLACK" : "WHITE";
    const lastMove = game.moves[0];
    const moveNumber = lastMove
      ? playerColor === "WHITE"
        ? lastMove.moveNumber
        : lastMove.moveNumber + 1
      : 1;

    // 9. Atomic database transaction
    const [savedMove, updatedGame] = await prisma.$transaction([
      prisma.gameMove.create({
        data: {
          gameId: game.id,
          moveNumber,
          playerId: userId,
          color: playerColor,
          from: moveDetails.from,
          to: moveDetails.to,
          promotion: moveDetails.promotion,
          san: moveDetails.san,
          fenAfter: moveDetails.fenAfter,
        },
      }),
      prisma.game.update({
        where: { id: game.id },
        data: {
          fen: moveDetails.fenAfter,
          pgn: chess.pgn(),
          currentTurn: nextTurn,
          whiteTimeMs: clockResult.newWhiteTimeMs,
          blackTimeMs: clockResult.newBlackTimeMs,
          lastMoveAt: moveTime,
          status: gameStatus,
          result: gameResult,
          winnerId,
          finishedAt,
          drawOfferFrom: null, // Clear any pending draw offer upon move
        },
      }),
    ]);

    // 10. Broadcast move event via Socket.IO
    const movePayload = {
      gameId: updatedGame.id,
      gameCode: updatedGame.gameCode,
      from: savedMove.from,
      to: savedMove.to,
      san: savedMove.san,
      fen: updatedGame.fen,
      fenAfter: savedMove.fenAfter,
      currentTurn: updatedGame.currentTurn,
      nextTurn: updatedGame.currentTurn,
      moveNumber: savedMove.moveNumber,
      color: savedMove.color,
      move: {
        id: savedMove.id,
        moveNumber: savedMove.moveNumber,
        playerId: savedMove.playerId,
        color: savedMove.color,
        from: savedMove.from,
        to: savedMove.to,
        promotion: savedMove.promotion,
        san: savedMove.san,
        fenAfter: savedMove.fenAfter,
      },
      whiteTimeMs: updatedGame.whiteTimeMs,
      blackTimeMs: updatedGame.blackTimeMs,
      inCheck: moveDetails.inCheck,
    };

    emitToGame(updatedGame.id, "game:move", movePayload);

    // If game ended, broadcast finished event
    if (gameStatus === "COMPLETED") {
      emitToGame(updatedGame.id, "game:finished", {
        gameId: updatedGame.id,
        gameCode: updatedGame.gameCode,
        result: updatedGame.result,
        winnerId: updatedGame.winnerId,
      });
    }

    // 11. Handle AI counter-move if Player vs AI and still active
    if (updatedGame.gameType === "PLAYER_VS_AI" && gameStatus === "ACTIVE") {
      this._scheduleAIMove(updatedGame.id, updatedGame.aiDifficulty);
    }

    return {
      success: true,
      move: movePayload.move,
      fen: updatedGame.fen,
      currentTurn: updatedGame.currentTurn,
      whiteTimeMs: updatedGame.whiteTimeMs,
      blackTimeMs: updatedGame.blackTimeMs,
      status: updatedGame.status,
      result: updatedGame.result,
      winnerId: updatedGame.winnerId,
    };
  }

  /**
   * Internal scheduler for AI counter-move
   */
  async _scheduleAIMove(gameId, aiDifficulty) {
    if (!activeAiTimers) {
      activeAiTimers = new Map();
    }

    // Cancel any prior pending timer for this game to prevent duplicate moves or race conditions
    if (activeAiTimers.has(gameId)) {
      clearTimeout(activeAiTimers.get(gameId));
      activeAiTimers.delete(gameId);
    }

    const timer = setTimeout(async () => {
      activeAiTimers.delete(gameId);
      try {
        const game = await prisma.game.findUnique({
          where: { id: gameId },
          include: { moves: { orderBy: { id: "desc" }, take: 1 } },
        });

        if (!game || game.status !== "ACTIVE" || game.gameType !== "PLAYER_VS_AI") return;

        // Strictly verify which color is controlled by the AI (slot without a human user ID)
        const isAiWhite = !game.whitePlayerId;
        const isAiBlack = !game.blackPlayerId;
        const expectedAiColor = isAiWhite ? "WHITE" : (isAiBlack ? "BLACK" : null);

        // Never play if it is not genuinely the AI's turn
        if (!expectedAiColor || game.currentTurn !== expectedAiColor) {
          return;
        }

        const aiMove = await aiService.getBestMove({
          fen: game.fen,
          difficulty: aiDifficulty || game.aiDifficulty,
        });

        if (!aiMove) return;

        const aiColor = expectedAiColor;
        const moveValidation = validateAndApplyMove(game.fen, aiMove, game.pgn);
        if (!moveValidation.success) return;

        const { moveDetails, chess } = moveValidation;
        const nextTurn = aiColor === "WHITE" ? "BLACK" : "WHITE";
        const moveTime = new Date();
        const clockResult = processMoveClock(game, aiColor, moveTime);

        let gameStatus = "ACTIVE";
        let gameResult = null;
        let winnerId = null;
        let finishedAt = null;

        if (moveDetails.isCheckmate) {
          const end = determineResult({ reason: "CHECKMATE", game, movingPlayerColor: aiColor });
          gameStatus = end.status;
          gameResult = end.result;
          winnerId = null; // AI won
          finishedAt = end.finishedAt;
        } else if (moveDetails.isStalemate || moveDetails.isDraw) {
          gameStatus = "COMPLETED";
          gameResult = moveDetails.isStalemate ? "STALEMATE" : "DRAW";
          finishedAt = new Date();
        }

        const lastMove = game.moves[0];
        const moveNumber = lastMove
          ? aiColor === "WHITE"
            ? lastMove.moveNumber
            : lastMove.moveNumber + 1
          : 1;

        const [savedMove, updatedGame] = await prisma.$transaction([
          prisma.gameMove.create({
            data: {
              gameId: game.id,
              moveNumber,
              playerId: null, // AI move
              color: aiColor,
              from: moveDetails.from,
              to: moveDetails.to,
              promotion: moveDetails.promotion,
              san: moveDetails.san,
              fenAfter: moveDetails.fenAfter,
            },
          }),
          prisma.game.update({
            where: { id: game.id },
            data: {
              fen: moveDetails.fenAfter,
              pgn: chess.pgn(),
              currentTurn: nextTurn,
              whiteTimeMs: clockResult.newWhiteTimeMs,
              blackTimeMs: clockResult.newBlackTimeMs,
              lastMoveAt: moveTime,
              status: gameStatus,
              result: gameResult,
              winnerId,
              finishedAt,
            },
          }),
        ]);

        const movePayload = {
          gameId: updatedGame.id,
          gameCode: updatedGame.gameCode,
          from: savedMove.from,
          to: savedMove.to,
          san: savedMove.san,
          fen: updatedGame.fen,
          fenAfter: savedMove.fenAfter,
          currentTurn: updatedGame.currentTurn,
          nextTurn: updatedGame.currentTurn,
          moveNumber: savedMove.moveNumber,
          color: savedMove.color,
          move: {
            id: savedMove.id,
            moveNumber: savedMove.moveNumber,
            playerId: null,
            color: savedMove.color,
            from: savedMove.from,
            to: savedMove.to,
            promotion: savedMove.promotion,
            san: savedMove.san,
            fenAfter: savedMove.fenAfter,
          },
          whiteTimeMs: updatedGame.whiteTimeMs,
          blackTimeMs: updatedGame.blackTimeMs,
          inCheck: moveDetails.inCheck,
        };

        emitToGame(updatedGame.id, "game:move", movePayload);

        if (gameStatus === "COMPLETED") {
          emitToGame(updatedGame.id, "game:finished", {
            gameId: updatedGame.id,
            gameCode: updatedGame.gameCode,
            result: updatedGame.result,
            winnerId: updatedGame.winnerId,
          });
        }
      } catch (err) {
        console.error("AI counter-move error:", err);
      }
    }, 400); // Small natural delay for AI thought

    activeAiTimers.set(gameId, timer);
  }
}

module.exports = new MoveService();
