/**
 * Result Service
 * Handles calculation and formatting of end-of-game conditions
 */

/**
 * Determine winner and result based on termination reason
 */
function determineResult({ reason, game, movingPlayerColor }) {
  let result = null;
  let winnerId = null;

  switch (reason) {
    case "CHECKMATE":
      result = "CHECKMATE";
      // The player who made the checkmating move is the winner
      winnerId =
        movingPlayerColor === "WHITE" ? game.whitePlayerId : game.blackPlayerId;
      break;

    case "STALEMATE":
      result = "STALEMATE";
      winnerId = null;
      break;

    case "DRAW":
      result = "DRAW";
      winnerId = null;
      break;

    case "RESIGNATION":
      result = "RESIGNATION";
      // The opposing player is the winner
      winnerId =
        movingPlayerColor === "WHITE" ? game.blackPlayerId : game.whitePlayerId;
      break;

    case "TIMEOUT":
      result = "TIMEOUT";
      // The player whose clock did NOT expire is the winner
      winnerId =
        movingPlayerColor === "WHITE" ? game.blackPlayerId : game.whitePlayerId;
      break;

    default:
      break;
  }

  return {
    status: "COMPLETED",
    result,
    winnerId,
    finishedAt: new Date(),
  };
}

module.exports = {
  determineResult,
};
