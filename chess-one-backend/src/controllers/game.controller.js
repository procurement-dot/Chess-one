const gameService = require("../services/game.service");
const moveService = require("../services/move.service");
const aiReviewService = require("../services/ai-review.service");
const { success } = require("../utils/response");

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
      const { from, to, promotion, clientTurnElapsedMs } = req.validatedBody;
      const result = await moveService.makeMove({
        gameId,
        userId: req.user.id,
        from,
        to,
        promotion,
        clientTurnElapsedMs,
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
      const review = await aiReviewService.analyzeGame(gameId);
      return success(res, { review });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new GameController();
