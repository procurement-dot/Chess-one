/**
 * Pure round-robin scheduling service (no database dependencies).
 * Implements standard Berger tables / Circle method for tournament pairings.
 */

/**
 * Calculate total rounds needed for round-robin tournament
 * @param {number} playerCount - Number of players
 * @returns {number} even n -> n-1, odd n -> n
 */
function roundRobinRoundCount(playerCount) {
  if (!playerCount || playerCount < 2) return 0;
  return playerCount % 2 === 0 ? playerCount - 1 : playerCount;
}

/**
 * Generate pairings for a specific round of a round-robin tournament
 * @param {number[]} seededIds - Player IDs ordered by seed (index 0 = seed 1)
 * @param {number} roundNumber - Round number (1-based)
 * @returns {Array<{ boardNumber: number, whiteId: number, blackId: number | null }>}
 * Bye pairings come LAST; boardNumber starts at 1 for real games.
 */
function roundRobinPairings(seededIds, roundNumber) {
  if (!Array.isArray(seededIds) || seededIds.length < 2) {
    return [];
  }

  const n = seededIds.length;
  const totalRounds = roundRobinRoundCount(n);
  if (roundNumber < 1 || roundNumber > totalRounds) {
    return [];
  }

  const isOdd = n % 2 !== 0;
  const list = [...seededIds];
  if (isOdd) {
    list.push(null);
  }
  const m = list.length; // even number of positions

  // Circle method: position 0 is fixed; positions 1..m-1 rotate by (roundNumber - 1) steps
  const shift = (roundNumber - 1) % (m - 1);
  const rotated = [list[0]];
  for (let k = 1; k < m; k++) {
    const origIdx = 1 + (((k - 1 - shift) % (m - 1)) + (m - 1)) % (m - 1);
    rotated.push(list[origIdx]);
  }

  const rawPairings = [];
  for (let i = 0; i < m / 2; i++) {
    const p1 = rotated[i];
    const p2 = rotated[m - 1 - i];

    let isP1White;
    if (i === 0) {
      // Fixed board: alternate by round (odd rounds White, even rounds Black)
      isP1White = roundNumber % 2 === 1;
    } else {
      // Other boards: alternate by board index to ensure color balance
      isP1White = i % 2 === 0;
    }

    let white = isP1White ? p1 : p2;
    let black = isP1White ? p2 : p1;

    if (white === null) {
      rawPairings.push({ whiteId: black, blackId: null, isBye: true });
    } else if (black === null) {
      rawPairings.push({ whiteId: white, blackId: null, isBye: true });
    } else {
      rawPairings.push({ whiteId: white, blackId: black, isBye: false });
    }
  }

  // Real games first, bye pairings last
  const realGames = rawPairings.filter((p) => !p.isBye);
  const byes = rawPairings.filter((p) => p.isBye);

  let currentBoardNumber = 1;
  const result = [];

  for (const game of realGames) {
    result.push({
      boardNumber: currentBoardNumber++,
      whiteId: game.whiteId,
      blackId: game.blackId,
    });
  }

  for (const bye of byes) {
    result.push({
      boardNumber: currentBoardNumber++,
      whiteId: bye.whiteId,
      blackId: null,
    });
  }

  return result;
}

module.exports = {
  roundRobinRoundCount,
  roundRobinPairings,
};
