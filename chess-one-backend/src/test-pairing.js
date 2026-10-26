const {
  roundRobinRoundCount,
  roundRobinPairings,
} = require("./services/tournament-pairing.service");

let passed = 0;
let failed = 0;

function check(testName, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`PASS: ${testName} ${detail}`);
  } else {
    failed++;
    console.error(`FAIL: ${testName} ${detail}`);
  }
}

console.log("==================================================");
console.log("♟️  ChessOne — Round Robin Pairing Unit Tests");
console.log("==================================================");

for (let n = 2; n <= 10; n++) {
  const players = Array.from({ length: n }, (_, i) => 100 + i);
  const totalRounds = roundRobinRoundCount(n);
  const expectedRounds = n % 2 === 0 ? n - 1 : n;

  // 1. Round count
  check(
    `n=${n}: roundRobinRoundCount`,
    totalRounds === expectedRounds,
    `expected=${expectedRounds}, got=${totalRounds}`
  );

  const pairCounts = new Map();
  const colorDiffs = {};
  const byeCounts = {};
  for (const p of players) {
    colorDiffs[p] = { white: 0, black: 0 };
    byeCounts[p] = 0;
  }

  let deterministicMatches = true;
  let noDuplicateInRound = true;

  for (let r = 1; r <= totalRounds; r++) {
    const pairings1 = roundRobinPairings(players, r);
    const pairings2 = roundRobinPairings(players, r);

    // Deterministic check
    if (JSON.stringify(pairings1) !== JSON.stringify(pairings2)) {
      deterministicMatches = false;
    }

    const seenInRound = new Set();
    for (const pairing of pairings1) {
      if (seenInRound.has(pairing.whiteId)) {
        noDuplicateInRound = false;
      }
      seenInRound.add(pairing.whiteId);

      if (pairing.blackId !== null) {
        if (seenInRound.has(pairing.blackId)) {
          noDuplicateInRound = false;
        }
        seenInRound.add(pairing.blackId);

        const key = [Math.min(pairing.whiteId, pairing.blackId), Math.max(pairing.whiteId, pairing.blackId)].join("-");
        pairCounts.set(key, (pairCounts.get(key) || 0) + 1);

        colorDiffs[pairing.whiteId].white++;
        colorDiffs[pairing.blackId].black++;
      } else {
        byeCounts[pairing.whiteId]++;
      }
    }
  }

  check(`n=${n}: deterministic identical output`, deterministicMatches);
  check(`n=${n}: nobody plays twice in one round`, noDuplicateInRound);

  // 2. Every unordered pair meets exactly once
  let allPairsMeetOnce = true;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const key = [players[i], players[j]].join("-");
      if (pairCounts.get(key) !== 1) {
        allPairsMeetOnce = false;
      }
    }
  }
  check(`n=${n}: all unordered pairs meet exactly once`, allPairsMeetOnce);

  // 3. Odd n: each player gets exactly 1 bye
  if (n % 2 !== 0) {
    let allOneBye = true;
    for (const p of players) {
      if (byeCounts[p] !== 1) {
        allOneBye = false;
      }
    }
    check(`n=${n}: each player gets exactly 1 bye`, allOneBye);
  }

  // 4. Color balance
  let colorBalanced = true;
  const maxDiff = n % 2 === 0 ? 1 : 2;
  for (const p of players) {
    const diff = Math.abs(colorDiffs[p].white - colorDiffs[p].black);
    if (diff > maxDiff) {
      colorBalanced = false;
    }
  }
  check(
    `n=${n}: color balance (|white - black| <= ${maxDiff})`,
    colorBalanced
  );
}

console.log("==================================================");
console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
console.log("==================================================");

if (failed > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
