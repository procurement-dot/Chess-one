/**
 * Authoritative Clock Service
 */

/**
 * Parse time control string e.g. "10+0", "3+2"
 * Format: <minutes>+<incrementSeconds>
 * @param {string} timeControlStr
 * @returns {{ initialTimeMs: number, incrementMs: number }}
 */
function parseTimeControl(timeControlStr) {
  if (!timeControlStr || typeof timeControlStr !== "string") {
    throw new Error(`Invalid time control: ${timeControlStr}`);
  }

  const parts = timeControlStr.split("+");
  if (parts.length !== 2) {
    throw new Error(`Invalid time control format: ${timeControlStr}`);
  }

  const minutes = parseFloat(parts[0]);
  const incrementSec = parseFloat(parts[1]);

  if (isNaN(minutes) || isNaN(incrementSec) || minutes <= 0 || incrementSec < 0) {
    throw new Error(`Invalid time control numbers: ${timeControlStr}`);
  }

  return {
    initialTimeMs: Math.round(minutes * 60 * 1000),
    incrementMs: Math.round(incrementSec * 1000),
  };
}

/**
 * Calculate current live remaining time for active turn
 * @param {object} game
 * @param {Date} now
 * @returns {{ whiteTimeMs: number, blackTimeMs: number, isTimedOut: boolean, timedOutColor: string|null }}
 */
function getLiveTimes(game, now = new Date()) {
  let whiteTimeMs = game.whiteTimeMs ?? 0;
  let blackTimeMs = game.blackTimeMs ?? 0;

  if (game.status !== "ACTIVE" || !game.lastMoveAt) {
    return {
      whiteTimeMs,
      blackTimeMs,
      isTimedOut: false,
      timedOutColor: null,
    };
  }

  const elapsedMs = Math.max(0, now.getTime() - new Date(game.lastMoveAt).getTime());

  if (game.currentTurn === "WHITE") {
    whiteTimeMs = Math.max(0, whiteTimeMs - elapsedMs);
    const isTimedOut = whiteTimeMs <= 0;
    return {
      whiteTimeMs,
      blackTimeMs,
      isTimedOut,
      timedOutColor: isTimedOut ? "WHITE" : null,
    };
  } else {
    blackTimeMs = Math.max(0, blackTimeMs - elapsedMs);
    const isTimedOut = blackTimeMs <= 0;
    return {
      whiteTimeMs,
      blackTimeMs,
      isTimedOut,
      timedOutColor: isTimedOut ? "BLACK" : null,
    };
  }
}

/**
 * Compute new clocks after a move is played
 * @param {object} game
 * @param {string} movingPlayerColor 'WHITE' | 'BLACK'
 * @param {Date} moveTime
 * @param {number} [clientTurnElapsedMs]
 * @returns {{ newWhiteTimeMs: number, newBlackTimeMs: number, hasTimedOut: boolean }}
 */
function processMoveClock(game, movingPlayerColor, moveTime = new Date(), clientTurnElapsedMs) {
  const { incrementMs } = parseTimeControl(game.timeControl);

  let whiteTimeMs = game.whiteTimeMs ?? 0;
  let blackTimeMs = game.blackTimeMs ?? 0;

  if (!game.lastMoveAt) {
    // First move of the game
    return {
      newWhiteTimeMs: whiteTimeMs,
      newBlackTimeMs: blackTimeMs,
      hasTimedOut: false,
    };
  }

  const rawElapsedMs = Math.max(0, moveTime.getTime() - new Date(game.lastMoveAt).getTime());

  // Latency allowance / Lag compensation (like Lichess/Chess.com):
  // Mobile requests take 1-2.5s over cellular networks.
  // We do not penalize players for transmission latency.
  let chargedElapsedMs = rawElapsedMs;
  if (typeof clientTurnElapsedMs === "number" && clientTurnElapsedMs >= 0) {
    const networkLagMs = Math.max(0, rawElapsedMs - clientTurnElapsedMs);
    const lagCompensation = Math.min(2500, networkLagMs);
    chargedElapsedMs = Math.max(100, rawElapsedMs - lagCompensation);
  } else {
    // Default mobile network latency tolerance: allow up to 1000ms buffer
    chargedElapsedMs = Math.max(100, rawElapsedMs - 1000);
  }

  if (movingPlayerColor === "WHITE") {
    const remaining = whiteTimeMs - chargedElapsedMs;
    if (remaining <= 0) {
      return {
        newWhiteTimeMs: 0,
        newBlackTimeMs: blackTimeMs,
        hasTimedOut: true,
      };
    }
    return {
      newWhiteTimeMs: remaining + incrementMs,
      newBlackTimeMs: blackTimeMs,
      hasTimedOut: false,
    };
  } else {
    const remaining = blackTimeMs - chargedElapsedMs;
    if (remaining <= 0) {
      return {
        newWhiteTimeMs: whiteTimeMs,
        newBlackTimeMs: 0,
        hasTimedOut: true,
      };
    }
    return {
      newWhiteTimeMs: whiteTimeMs,
      newBlackTimeMs: remaining + incrementMs,
      hasTimedOut: false,
    };
  }
}

module.exports = {
  parseTimeControl,
  getLiveTimes,
  processMoveClock,
};
