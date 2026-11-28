const prisma = require("../config/database");
const { requireOwnership } = require("./rbac.middleware");
const tournamentService = require("../services/tournament.service");

const requireTournamentOwner = requireOwnership(
  async (req) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return null;
    if (tournamentService.inMemoryTournaments && tournamentService.inMemoryTournaments.has(id)) {
      return tournamentService.inMemoryTournaments.get(id).createdBy;
    }
    try {
      const t = await prisma.tournament.findUnique({ where: { id }, select: { createdBy: true } });
      return t ? t.createdBy : null;
    } catch (err) {
      if (tournamentService.inMemoryTournaments && tournamentService.inMemoryTournaments.has(id)) {
        return tournamentService.inMemoryTournaments.get(id).createdBy;
      }
      return null;
    }
  },
  { notFoundCode: "TOURNAMENT_NOT_FOUND", notFoundMessage: "Tournament not found" }
);

module.exports = { requireTournamentOwner };
