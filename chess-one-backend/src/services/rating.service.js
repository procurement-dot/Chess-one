const prisma = require("../config/database");

/**
 * Calculate expected Elo score for player A against player B
 * @param {number} a - Rating of player A
 * @param {number} b - Rating of player B
 * @returns {number} Expected score between 0 and 1
 */
function expectedScore(a, b) {
  return 1 / (1 + 10 ** ((b - a) / 400));
}

/**
 * Determine K-factor based on number of games played
 * @param {number} gamesPlayed
 * @returns {number} 40 for provisional (< 30 games), 20 otherwise
 */
function kFactor(gamesPlayed) {
  return gamesPlayed < 30 ? 40 : 20;
}

/**
 * Apply Elo rating changes for a completed player-vs-player game.
 * Idempotent and race-safe: guaranteed to apply at most once per game.
 * Never throws on AI, cancelled, or aborted games (returns null).
 *
 * @param {number|string} gameId
 * @returns {Promise<{whiteRatingChange: number, blackRatingChange: number, whiteRating: number, blackRating: number} | null>}
 */
async function applyRating(gameId) {
  try {
    const numericId = parseInt(gameId, 10);
    if (isNaN(numericId)) {
      return null;
    }

    return await prisma.$transaction(async (tx) => {
      // Atomic claim: only succeed if the game is COMPLETED, PLAYER_VS_PLAYER,
      // not yet rated, and has both players assigned.
      const claimed = await tx.game.updateMany({
        where: {
          id: numericId,
          status: "COMPLETED",
          gameType: "PLAYER_VS_PLAYER",
          ratingApplied: false,
          whitePlayerId: { not: null },
          blackPlayerId: { not: null },
        },
        data: {
          ratingApplied: true,
        },
      });

      if (claimed.count === 0) {
        return null;
      }

      const game = await tx.game.findUnique({
        where: { id: numericId },
        include: {
          whitePlayer: {
            select: { id: true, rating: true, gamesPlayed: true },
          },
          blackPlayer: {
            select: { id: true, rating: true, gamesPlayed: true },
          },
        },
      });

      if (!game || !game.whitePlayer || !game.blackPlayer) {
        return null;
      }

      // Score for White: win = 1, loss = 0, draw or stalemate (winnerId = null) = 0.5
      let whiteScore = 0.5;
      if (game.winnerId !== null) {
        if (game.winnerId === game.whitePlayerId) {
          whiteScore = 1;
        } else if (game.winnerId === game.blackPlayerId) {
          whiteScore = 0;
        }
      }
      const blackScore = 1 - whiteScore;

      const whiteRatingBefore = game.whitePlayer.rating;
      const blackRatingBefore = game.blackPlayer.rating;

      const whiteExpected = expectedScore(whiteRatingBefore, blackRatingBefore);
      const blackExpected = expectedScore(blackRatingBefore, whiteRatingBefore);

      const whiteK = kFactor(game.whitePlayer.gamesPlayed);
      const blackK = kFactor(game.blackPlayer.gamesPlayed);

      const whiteRatingChange = Math.round(whiteK * (whiteScore - whiteExpected));
      const blackRatingChange = Math.round(blackK * (blackScore - blackExpected));

      // Clamp ratings to never drop below 100
      const newWhiteRating = Math.max(100, whiteRatingBefore + whiteRatingChange);
      const newBlackRating = Math.max(100, blackRatingBefore + blackRatingChange);

      const updatedWhite = await tx.user.update({
        where: { id: game.whitePlayerId },
        data: {
          rating: newWhiteRating,
          gamesPlayed: { increment: 1 },
        },
        select: { rating: true },
      });

      const updatedBlack = await tx.user.update({
        where: { id: game.blackPlayerId },
        data: {
          rating: newBlackRating,
          gamesPlayed: { increment: 1 },
        },
        select: { rating: true },
      });

      await tx.game.update({
        where: { id: game.id },
        data: {
          whiteRatingChange,
          blackRatingChange,
        },
      });

      return {
        whiteRatingChange,
        blackRatingChange,
        whiteRating: updatedWhite.rating,
        blackRating: updatedBlack.rating,
      };
    });
  } catch (err) {
    console.error("Error in applyRating:", err);
    return null;
  }
}

module.exports = {
  applyRating,
  expectedScore,
  kFactor,
};
