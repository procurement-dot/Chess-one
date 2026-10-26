const prisma = require("../config/database");
const { requireOwnership } = require("./rbac.middleware");

const requireTournamentOwner = requireOwnership(
  async (req) => {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id)) return null;
    const t = await prisma.tournament.findUnique({ where: { id }, select: { createdBy: true } });
    return t ? t.createdBy : null;
  },
  { notFoundCode: "TOURNAMENT_NOT_FOUND", notFoundMessage: "Tournament not found" }
);

module.exports = { requireTournamentOwner };
