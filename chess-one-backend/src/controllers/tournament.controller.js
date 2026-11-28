const tournamentService = require("../services/tournament.service");
const tournamentRoundService = require("../services/tournament-round.service");
const { success } = require("../utils/response");

class TournamentController {
  async create(req, res, next) {
    try {
      const data = req.validatedBody;
      const result = await tournamentService.createTournament(req.user, data);
      return success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async list(req, res, next) {
    try {
      const query = req.validatedQuery || req.query;
      const result = await tournamentService.listTournaments(req.user, query);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async getOne(req, res, next) {
    try {
      const result = await tournamentService.getTournament(req.user, req.tournamentId);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = req.validatedBody;
      const result = await tournamentService.updateTournament(req.user, req.tournamentId, data);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async cancel(req, res, next) {
    try {
      const result = await tournamentService.cancelTournament(req.user, req.tournamentId);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async join(req, res, next) {
    try {
      const result = await tournamentService.joinTournament(req.user, req.tournamentId);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async leave(req, res, next) {
    try {
      const result = await tournamentService.leaveTournament(req.user, req.tournamentId);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async start(req, res, next) {
    try {
      const result = await tournamentRoundService.startTournament(req.tournamentId, req.user);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async getRound(req, res, next) {
    try {
      const result = await tournamentRoundService.getRound(req.tournamentId, req.params.roundNumber);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }

  async myGame(req, res, next) {
    try {
      const result = await tournamentRoundService.getMyGame(req.tournamentId, req.user);
      return success(res, result, 200);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TournamentController();
