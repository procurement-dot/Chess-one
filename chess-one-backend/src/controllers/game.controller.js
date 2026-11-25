const gameService = require("../services/game.service");
const moveService = require("../services/move.service");
const aiReviewService = require("../services/ai-review.service");
const stockfishService = require("../services/stockfish.service");
const { Chess } = require("chess.js");
const { success, error } = require("../utils/response");

const aiMoveRateLimits = new Map();

class GameController {
  async createGame(req, res, next) {
    try {
      const { gameType, timeControl, colorPreference, aiDifficulty } = req.validatedBody;
      const result = await gameService.createGame({
        userId: req.user.id,
        gameType,
        timeControl,
        colorPreference,
        aiDifficulty,
      });

      return success(res, { game: result }, 201);
    } catch (err) {
      next(err);
    }
  }

  async getGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await gameService.getGame(gameId);
      return success(res, { game });
    } catch (err) {
      next(err);
    }
  }

  async getGameState(req, res, next) {
    try {
      const { gameId } = req.params;
      const game = await gameService.getGameState(gameId);
      return success(res, { game });
    } catch (err) {
      next(err);
    }
  }

  async joinGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.joinGame({
        gameId,
        userId: req.user.id,
      });
      return success(res, { game: result });
    } catch (err) {
      next(err);
    }
  }

  async cancelGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.cancelWaitingGame({
        gameId,
        userId: req.user.id,
      });
      return success(res, { result });
    } catch (err) {
      next(err);
    }
  }

  async makeMove(req, res, next) {
    try {
      const { gameId } = req.params;
      const { from, to, promotion } = req.validatedBody;
      const result = await moveService.makeMove({
        gameId,
        userId: req.user.id,
        from,
        to,
        promotion,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getGameMoves(req, res, next) {
    try {
      const { gameId } = req.params;
      const moves = await gameService.getGameMoves(gameId);
      return success(res, { moves });
    } catch (err) {
      next(err);
    }
  }

  async getGamePgn(req, res, next) {
    try {
      const { gameId } = req.params;
      const pgn = await gameService.getGamePgn(gameId);
      return success(res, pgn);
    } catch (err) {
      next(err);
    }
  }

  async getGameResult(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.getGameResult(gameId);
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async abortGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const { reason } = req.body || {};
      const result = await gameService.abortGame({
        gameId,
        userId: req.user?.id,
        reason,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async resign(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.resignGame({
        gameId,
        userId: req.user.id,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async offerDraw(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.offerDraw({
        gameId,
        userId: req.user.id,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async acceptDraw(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.respondDraw({
        gameId,
        userId: req.user.id,
        accept: true,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async rejectDraw(req, res, next) {
    try {
      const { gameId } = req.params;
      const result = await gameService.respondDraw({
        gameId,
        userId: req.user.id,
        accept: false,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getMyGames(req, res, next) {
    try {
      const { status, gameType, page, limit } = req.query;
      const result = await gameService.getMyGames({
        userId: req.user.id,
        status,
        gameType,
        page,
        limit,
      });
      return success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getAiReview(req, res, next) {
    try {
      const { gameId } = req.params;
      const { moves } = req.body || {};
      const review = await aiReviewService.analyzeGame(gameId, moves);
      return success(res, { review });
    } catch (err) {
      next(err);
    }
  }

  async finishAiGame(req, res, next) {
    try {
      const { gameId } = req.params;
      const { fen, pgn, result, winnerId, whiteTimeMs, blackTimeMs, moves } = req.body;
      const data = await gameService.finishAiGame({
        gameId,
        userId: req.user.id,
        fen,
        pgn,
        result,
        winnerId,
        whiteTimeMs,
        blackTimeMs,
        moves,
      });
      return success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getAiMove(req, res, next) {
    try {
      const { gameId } = req.params;
      const { fen, difficulty = "MEDIUM", timeControl, remainingTimeMs } = req.validatedBody;

      // Rate limit per game/caller (300ms window)
      const now = Date.now();
      const rateKey = `${gameId}_${req.user?.id || req.ip || "client"}`;
      const lastCall = aiMoveRateLimits.get(rateKey) || 0;
      if (now - lastCall < 300) {
        return error(res, "RATE_LIMIT_EXCEEDED", "Too many AI move requests. Please wait.", 429);
      }
      aiMoveRateLimits.set(rateKey, now);

      // Clean old entries periodically
      if (aiMoveRateLimits.size > 500) {
        for (const [k, v] of aiMoveRateLimits.entries()) {
          if (now - v > 60000) aiMoveRateLimits.delete(k);
        }
      }

      // Attempt to load game metadata if present
      let game = null;
      try {
        game = await gameService.getGame(gameId);
      } catch (err) {
        // If DB is offline or game is client-managed, proceed with requested parameters
      }

      if (game && game.status && (game.status === "COMPLETED" || game.status === "CANCELLED")) {
        return error(res, "GAME_NOT_ACTIVE", "Game is not active", 400);
      }

      // Validate FEN with chess.js
      try {
        const testChess = new Chess(fen);
        if (testChess.isGameOver()) {
          return error(res, "GAME_OVER", "Game is already over", 400);
        }
      } catch (e) {
        return error(res, "INVALID_FEN", "Invalid FEN string provided", 400);
      }

      // Calculate AI move via Stockfish
      const move = await stockfishService.getBestMove({
        fen,
        difficulty: difficulty || game?.aiDifficulty || "MEDIUM",
        timeControl: timeControl || game?.timeControl,
        remainingTimeMs,
      });

      if (!move) {
        return error(res, "ENGINE_UNAVAILABLE", "Stockfish engine was unable to compute move", 503);
      }

      return success(res, {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
        san: move.san,
        data: {
          from: move.from,
          to: move.to,
          promotion: move.promotion,
          san: move.san,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GameController();
