const prisma = require("../config/database");

/**
 * Register tournament-related socket handlers
 */
function registerTournamentHandlers(io, socket) {
  /**
   * Client joins a live tournament room
   * Payload: { tournamentId: 1 }
   */
  socket.on("tournament:join", async (payload = {}, callback) => {
    try {
      const { tournamentId } = payload;
      if (!tournamentId) return;

      const numericId = parseInt(tournamentId, 10);
      if (isNaN(numericId)) return;

      const userId = socket.data?.user?.id || socket.userId;
      if (!userId) {
        socket.emit("error", { code: "UNAUTHORIZED", message: "Authentication required" });
        return;
      }

      const tournament = await prisma.tournament.findUnique({
        where: { id: numericId },
        select: { id: true },
      });

      if (!tournament) {
        socket.emit("error", { code: "TOURNAMENT_NOT_FOUND", message: "Tournament not found" });
        return;
      }

      const roomName = `tournament:${tournament.id}`;
      socket.join(roomName);

      if (typeof callback === "function") {
        callback({ ok: true });
      } else {
        socket.emit("tournament:joined", { ok: true, tournamentId: tournament.id });
      }
    } catch (err) {
      console.error("Socket tournament:join error:", err);
    }
  });

  /**
   * Client leaves a tournament room
   * Payload: { tournamentId: 1 }
   */
  socket.on("tournament:leave", async (payload = {}, callback) => {
    try {
      const { tournamentId } = payload;
      if (!tournamentId) return;

      const numericId = parseInt(tournamentId, 10);
      if (isNaN(numericId)) return;

      socket.leave(`tournament:${numericId}`);

      if (typeof callback === "function") {
        callback({ ok: true });
      }
    } catch (err) {
      console.error("Socket tournament:leave error:", err);
    }
  });
}

module.exports = {
  registerTournamentHandlers,
};
