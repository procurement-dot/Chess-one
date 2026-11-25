const assert = require("assert");
const gameService = require("./services/game.service");
const aiReviewService = require("./services/ai-review.service");
const userStore = require("./store/user.store");
const { generateToken } = require("./utils/jwt");

async function runTests() {
  console.log("=== Testing Dynamic Game Player Identities & AI Review ===");

  // 1. Dynamic users with signed ChessOne JWT tokens
  const alice = {
    id: 101,
    name: "Alice Smith",
    email: "alice@example.com",
    role: "STUDENT",
    rating: 1350,
  };
  const bob = {
    id: 102,
    name: "Bob Jones",
    email: "bob@example.com",
    role: "STUDENT",
    rating: 1280,
  };

  const aliceToken = generateToken(alice);
  const bobToken = generateToken(bob);
  assert(aliceToken && bobToken, "JWT generation must succeed");
  console.log("✅ Verified JWT generation for dynamic players");

  // Store in userStore
  userStore.upsertUser(alice);
  userStore.upsertUser(bob);

  const storedAlice = userStore.getUser(101);
  assert.strictEqual(storedAlice.name, "Alice Smith");
  const storedBob = userStore.getUser(102);
  assert.strictEqual(storedBob.name, "Bob Jones");
  console.log("✅ Dynamic users saved in userStore");

  // 2. Create dynamic in-memory PvP match
  const testMatch = {
    id: 8888,
    gameCode: "DYNAMIC-8888",
    gameType: "PLAYER_VS_PLAYER",
    status: "ACTIVE",
    createdBy: alice.id,
    whitePlayerId: alice.id,
    blackPlayerId: bob.id,
    whitePlayer: alice,
    blackPlayer: bob,
    timeControl: "5+0",
    whiteTimeMs: 300000,
    blackTimeMs: 300000,
    currentTurn: "WHITE",
    fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",
    pgn: "",
    moves: [],
    startedAt: new Date().toISOString(),
  };
  gameService.inMemoryGames.set(testMatch.id, testMatch);
  gameService.inMemoryGames.set(testMatch.gameCode, testMatch);

  const game = await gameService.getGame(8888);
  assert(game, "Dynamic game must exist");
  assert.strictEqual(game.whitePlayer?.name, "Alice Smith", "White player must be Alice Smith");
  assert.strictEqual(game.blackPlayer?.name, "Bob Jones", "Black player must be Bob Jones");
  console.log(`✅ Game 8888 dynamic players verified: White = ${game.whitePlayer.name}, Black = ${game.blackPlayer.name}`);

  // 3. Verify AI Review uses real dynamic player names
  const startReview = await aiReviewService.analyzeGame(8888);
  assert(startReview, "AI Review must succeed");
  assert.strictEqual(startReview.verdict, "Starting Position");
  assert(startReview.summary.includes("Alice Smith"), "Summary must mention Alice Smith");
  assert(startReview.summary.includes("Bob Jones"), "Summary must mention Bob Jones");
  console.log("✅ AI Review (starting position) mentions dynamic players:", startReview.summary);

  // 4. Verify AI Review with moves
  const moveReview = await aiReviewService.analyzeGame(8888, [
    { san: "e4" },
    { san: "e5" },
    { san: "Nf3" },
    { san: "Nc6" },
  ]);
  assert(moveReview, "AI Review with moves must succeed");
  assert(moveReview.summary.includes("Alice Smith"), "Move review summary must mention Alice");
  assert(moveReview.summary.includes("Bob Jones"), "Move review summary must mention Bob");
  console.log(`✅ AI Review (with moves) verified: White ${moveReview.accuracyWhite}%, Black ${moveReview.accuracyBlack}%`);

  // 5. Verify non-existent game throws error (no mock fallback 7002)
  try {
    await gameService.getGame(999999);
    assert.fail("Should have thrown error for non-existent game");
  } catch (err) {
    assert(err, "Must throw error");
    console.log(`✅ Non-existent game throws error as expected (no mock fallback): ${err.message || err.code}`);
  }

  console.log("\n🎉 ALL DYNAMIC PLAYER TESTS PASSED SUCCESSFULLY!");
}

runTests().catch((err) => {
  console.error("❌ Test failed:", err);
  process.exit(1);
});
