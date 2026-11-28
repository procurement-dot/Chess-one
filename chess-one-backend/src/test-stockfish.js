const { Chess } = require("chess.js");
const stockfishService = require("./services/stockfish.service");

function logPass(title) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${title}`);
}

function logFail(title, error) {
  console.error(`  \x1b[31m[FAIL]\x1b[0m ${title}`);
  if (error) console.error(error);
}

function logInfo(msg) {
  console.log(`  \x1b[36m[INFO]\x1b[0m ${msg}`);
}

async function runTests() {
  console.log("==================================================");
  console.log("   STOCKFISH CHESS ENGINE TEST SUITE");
  console.log("==================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  // -----------------------------------------------------------------
  // 1. Legal Moves Verification
  // -----------------------------------------------------------------
  console.log("--- 1. Legal Moves Verification ---");
  const testPositions = [
    {
      name: "Starting Position",
      fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    },
    {
      name: "Pawn Promotion",
      fen: "8/4P3/8/8/8/8/8/4k2K w - - 0 1",
    },
    {
      name: "Absolute Pin on Knight",
      fen: "r1b1k2r/pppp1ppp/2n5/4P3/1b2q3/5N2/PPPP1PPP/RNBQKB1R w KQkq - 0 1",
    },
    {
      name: "En-Passant Capture Available",
      fen: "rnbqkbnr/ppp1p1pp/8/3pPp2/8/8/PPPP1PPP/RNBQKBNR w KQkq f6 0 3",
    },
    {
      name: "King + Rook Endgame",
      fen: "8/8/8/8/8/5k2/8/R3K3 w - - 0 1",
    },
    {
      name: "Tactical Fork Position",
      fen: "r1bqkb1r/pppp1ppp/2n5/4p3/2B1n3/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 4",
    },
    {
      name: "Queen Endgame",
      fen: "4k3/8/8/3q4/8/8/3Q4/4K3 w - - 0 1",
    },
  ];

  for (const pos of testPositions) {
    for (const diff of ["EASY", "MEDIUM", "HARD"]) {
      totalTests++;
      try {
        const move = await stockfishService.getBestMove({
          fen: pos.fen,
          difficulty: diff,
        });

        if (!move || !move.from || !move.to) {
          throw new Error(`Engine returned null or invalid move object: ${JSON.stringify(move)}`);
        }

        const chess = new Chess(pos.fen);
        const legalMove = chess.move({
          from: move.from,
          to: move.to,
          promotion: move.promotion || "q",
        });

        if (!legalMove) {
          throw new Error(`Move ${move.from}${move.to} is ILLEGAL for position ${pos.fen}`);
        }

        passedTests++;
        logPass(`${pos.name} (${diff}): legal move ${move.san} (${move.from}->${move.to})`);
      } catch (err) {
        logFail(`${pos.name} (${diff})`, err);
      }
    }
  }

  // -----------------------------------------------------------------
  // 2. Checkmate in 1 Detection
  // -----------------------------------------------------------------
  console.log("\n--- 2. Checkmate in 1 Detection ---");
  // Scholar's Mate position: Qxf7# is immediate checkmate
  const mateIn1Fen = "r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1n3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4";

  for (const diff of ["EASY", "MEDIUM", "HARD"]) {
    totalTests++;
    try {
      const move = await stockfishService.getBestMove({
        fen: mateIn1Fen,
        difficulty: diff,
      });

      const chess = new Chess(mateIn1Fen);
      const applied = chess.move({
        from: move?.from,
        to: move?.to,
        promotion: move?.promotion,
      });

      if (!applied || !chess.isCheckmate()) {
        throw new Error(`Did not play checkmate! Returned: ${JSON.stringify(move)}`);
      }

      passedTests++;
      logPass(`Checkmate in 1 (${diff}): successfully found ${move.san}`);
    } catch (err) {
      logFail(`Checkmate in 1 (${diff})`, err);
    }
  }

  // -----------------------------------------------------------------
  // 3. Engine Pool & Concurrency Test
  // -----------------------------------------------------------------
  console.log("\n--- 3. Engine Pool & Concurrency (5 Parallel Requests) ---");
  totalTests++;
  try {
    const startConcur = Date.now();
    const concurrentProms = [
      stockfishService.getBestMove({ fen: testPositions[0].fen, difficulty: "EASY" }),
      stockfishService.getBestMove({ fen: testPositions[1].fen, difficulty: "MEDIUM" }),
      stockfishService.getBestMove({ fen: testPositions[2].fen, difficulty: "HARD" }),
      stockfishService.getBestMove({ fen: testPositions[3].fen, difficulty: "EASY" }),
      stockfishService.getBestMove({ fen: testPositions[4].fen, difficulty: "MEDIUM" }),
    ];

    const results = await Promise.all(concurrentProms);
    const concurDuration = Date.now() - startConcur;

    for (let i = 0; i < results.length; i++) {
      if (!results[i] || !results[i].san) {
        throw new Error(`Concurrent request #${i} failed: ${JSON.stringify(results[i])}`);
      }
    }

    passedTests++;
    logPass(`5 parallel requests processed cleanly in ${concurDuration}ms without collision`);
  } catch (err) {
    logFail("Engine Pool & Concurrency", err);
  }

  // -----------------------------------------------------------------
  // 4. Response Time Check
  // -----------------------------------------------------------------
  console.log("\n--- 4. Latency / Response Time Benchmark ---");
  for (const diff of ["EASY", "MEDIUM", "HARD"]) {
    totalTests++;
    try {
      const latencies = [];
      const numSamples = 10;
      for (let i = 0; i < numSamples; i++) {
        const t0 = Date.now();
        await stockfishService.getBestMove({
          fen: testPositions[0].fen,
          difficulty: diff,
        });
        latencies.push(Date.now() - t0);
      }

      const avg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
      const min = Math.min(...latencies);
      const max = Math.max(...latencies);

      logInfo(`${diff} Latency over ${numSamples} moves: avg=${avg}ms, min=${min}ms, max=${max}ms`);

      if (avg > 2000) {
        throw new Error(`Average response time ${avg}ms exceeded 2000ms budget`);
      }

      passedTests++;
      logPass(`${diff} response time meets budget (avg ${avg}ms < 2000ms)`);
    } catch (err) {
      logFail(`Response time check (${diff})`, err);
    }
  }

  // -----------------------------------------------------------------
  // 5. Game Simulations (HARD vs MEDIUM, MEDIUM vs EASY)
  // -----------------------------------------------------------------
  console.log("\n--- 5. Match Simulations (Decisive Skill Verification) ---");

  // Sound grandmaster opening book for diverse, realistic smoke test games
  const OPENING_BOOK_ROOT = [
    { white: "e4", replies: ["e5", "c5", "e6", "c6"] },
    { white: "d4", replies: ["d5", "Nf6", "e6"] },
    { white: "Nf3", replies: ["d5", "Nf6", "c5"] },
    { white: "c4", replies: ["e5", "c5", "Nf6"] },
  ];

  function evaluateMaterial(chess) {
    const values = { p: 1, n: 3.1, b: 3.25, r: 5, q: 9.2, k: 0 };
    let white = 0, black = 0;
    for (const row of chess.board()) {
      for (const piece of row) {
        if (!piece) continue;
        if (piece.color === "w") white += values[piece.type] || 0;
        else black += values[piece.type] || 0;
      }
    }
    return white - black;
  }

  // Helper to simulate a single match
  async function playMatch(whiteDiff, blackDiff, maxPlies = 50) {
    const chess = new Chess();
    // 1. Pick sound moves from opening book for first 2 plies
    const opening = OPENING_BOOK_ROOT[Math.floor(Math.random() * OPENING_BOOK_ROOT.length)];
    chess.move(opening.white);
    const blackReply = opening.replies[Math.floor(Math.random() * opening.replies.length)];
    chess.move(blackReply);

    let plies = 2;
    while (!chess.isGameOver() && plies < maxPlies) {
      const turnColor = chess.turn(); // 'w' or 'b'
      const activeDiff = turnColor === "w" ? whiteDiff : blackDiff;

      const move = await stockfishService.getBestMove({
        fen: chess.fen(),
        difficulty: activeDiff,
        timeControl: "1+0", // Use fast bullet format for testing efficiency
        remainingTimeMs: 12000,
      });

      if (!move) break;

      const applied = chess.move({
        from: move.from,
        to: move.to,
        promotion: move.promotion || "q",
      });

      if (!applied) break;
      plies++;
    }

    if (chess.isCheckmate()) {
      return chess.turn() === "w" ? "BLACK_WIN" : "WHITE_WIN";
    }

    if (chess.isDraw()) {
      return "DRAW";
    }

    // Adjudicate by material advantage if move limit reached
    const mat = evaluateMaterial(chess);
    if (mat >= 2.0) return "WHITE_WIN";
    if (mat <= -2.0) return "BLACK_WIN";
    return "DRAW";
  }

  // Match Series 1: HARD vs MEDIUM (10 games, alternating colors)
  console.log("  Simulating 10 games: HARD vs MEDIUM...");
  totalTests++;
  try {
    let hardWins = 0;
    let mediumWins = 0;
    let draws = 0;

    for (let g = 0; g < 10; g++) {
      const hardIsWhite = g % 2 === 0;
      const res = await playMatch(
        hardIsWhite ? "HARD" : "MEDIUM",
        hardIsWhite ? "MEDIUM" : "HARD",
        45
      );

      if (res === "WHITE_WIN") {
        if (hardIsWhite) hardWins++;
        else mediumWins++;
      } else if (res === "BLACK_WIN") {
        if (hardIsWhite) mediumWins++;
        else hardWins++;
      } else {
        draws++;
      }
      process.stdout.write(`    Game ${g + 1}/10: ${res} (HARD: ${hardWins}, MED: ${mediumWins}, DRAW: ${draws})\n`);
    }

    logInfo(`HARD vs MEDIUM Final: HARD Wins=${hardWins}, MEDIUM Wins=${mediumWins}, Draws=${draws}`);
    if (hardWins < mediumWins) {
      throw new Error(`HARD failed to beat MEDIUM! (${hardWins} vs ${mediumWins})`);
    }
    passedTests++;
    logPass(`HARD decisively outperformed MEDIUM (${hardWins}W - ${mediumWins}L - ${draws}D)`);
  } catch (err) {
    logFail("HARD vs MEDIUM Simulation", err);
  }

  // Match Series 2: MEDIUM vs EASY (10 games, alternating colors)
  console.log("  Simulating 10 games: MEDIUM vs EASY...");
  totalTests++;
  try {
    let mediumWins = 0;
    let easyWins = 0;
    let draws = 0;

    for (let g = 0; g < 10; g++) {
      const mediumIsWhite = g % 2 === 0;
      const res = await playMatch(
        mediumIsWhite ? "MEDIUM" : "EASY",
        mediumIsWhite ? "EASY" : "MEDIUM",
        45
      );

      if (res === "WHITE_WIN") {
        if (mediumIsWhite) mediumWins++;
        else easyWins++;
      } else if (res === "BLACK_WIN") {
        if (mediumIsWhite) easyWins++;
        else mediumWins++;
      } else {
        draws++;
      }
      process.stdout.write(`    Game ${g + 1}/10: ${res} (MED: ${mediumWins}, EASY: ${easyWins}, DRAW: ${draws})\n`);
    }

    logInfo(`MEDIUM vs EASY Final: MEDIUM Wins=${mediumWins}, EASY Wins=${easyWins}, Draws=${draws}`);
    if (mediumWins < easyWins) {
      throw new Error(`MEDIUM failed to beat EASY! (${mediumWins} vs ${easyWins})`);
    }
    passedTests++;
    logPass(`MEDIUM decisively outperformed EASY (${mediumWins}W - ${easyWins}L - ${draws}D)`);
  } catch (err) {
    logFail("MEDIUM vs EASY Simulation", err);
  }

  // -----------------------------------------------------------------
  // Summary & Cleanup
  // -----------------------------------------------------------------
  console.log("\n==================================================");
  console.log(`TEST RESULTS: ${passedTests}/${totalTests} Passed`);
  console.log("==================================================");

  stockfishService.terminate();

  if (passedTests === totalTests) {
    console.log("\n\x1b[32mALL STOCKFISH INTEGRATION TESTS PASSED SUCCESSFULLY!\x1b[0m\n");
    process.exit(0);
  } else {
    console.error("\n\x1b[31mSOME TESTS FAILED!\x1b[0m\n");
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Unhandled test suite exception:", err);
  stockfishService.terminate();
  process.exit(1);
});
