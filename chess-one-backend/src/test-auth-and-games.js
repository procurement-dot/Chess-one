const http = require("http");
const app = require("./app");
const prisma = require("./config/database");
const { generateToken } = require("./utils/jwt");

const TEST_PORT = 4998;
let server;

async function request(path, options = {}) {
  const url = `http://localhost:${TEST_PORT}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse JSON response:", res.status, text);
    throw e;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAuthTestSuite() {
  console.log("==================================================");
  console.log("🔒 ChessOne — Authentication & Game API Test Suite 🔒");
  console.log("==================================================\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Auth test server running on port ${TEST_PORT}`);

  try {
    // 1. Health check
    console.log("\n▶ TEST 1: Health Check");
    const health = await request("/health");
    if (health.status === 200 && health.data.success) {
      console.log("  ✅ Health check returned 200:", health.data.message);
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(health.data)}`);
    }

    // 2. Google Auth validation tests
    console.log("\n▶ TEST 2: Google Auth - Reject Missing Token");
    const missingTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: {},
    });
    if (missingTokenRes.status === 400 && missingTokenRes.data.error.code === "VALIDATION_ERROR") {
      console.log("  ✅ Missing idToken rejected with 400 VALIDATION_ERROR");
    } else {
      throw new Error(`Expected 400 VALIDATION_ERROR, got: ${missingTokenRes.status}`);
    }

    console.log("\n▶ TEST 3: Google Auth - Reject Empty Token");
    const emptyTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: { idToken: "" },
    });
    if (emptyTokenRes.status === 400 && emptyTokenRes.data.error.code === "VALIDATION_ERROR") {
      console.log("  ✅ Empty idToken rejected with 400 VALIDATION_ERROR");
    } else {
      throw new Error(`Expected 400 VALIDATION_ERROR, got: ${emptyTokenRes.status}`);
    }

    console.log("\n▶ TEST 4: Google Auth - Reject Invalid Cryptographic Token");
    const invalidTokenRes = await request("/api/auth/google", {
      method: "POST",
      body: { idToken: "fake-unverified-google-id-token" },
    });
    if (invalidTokenRes.status === 401 && invalidTokenRes.data.error.code === "INVALID_GOOGLE_TOKEN") {
      console.log("  ✅ Cryptographically invalid Google token rejected with 401 INVALID_GOOGLE_TOKEN");
    } else {
      throw new Error(`Expected 401 INVALID_GOOGLE_TOKEN, got: ${invalidTokenRes.status}`);
    }

    // 3. Auth Middleware security tests
    console.log("\n▶ TEST 5: Protected Route - Reject Missing Authorization Header");
    const noHeaderRes = await request("/api/auth/me");
    if (noHeaderRes.status === 401 && noHeaderRes.data.error.code === "UNAUTHORIZED") {
      console.log("  ✅ Request without Authorization header rejected with 401 UNAUTHORIZED");
    } else {
      throw new Error(`Expected 401 UNAUTHORIZED, got: ${noHeaderRes.status}`);
    }

    console.log("\n▶ TEST 6: Protected Route - Reject Malformed Authorization Header");
    const malformedRes = await request("/api/auth/me", {
      headers: { Authorization: "Basic dXNlcjpwYXNz" },
    });
    if (malformedRes.status === 401 && malformedRes.data.error.code === "UNAUTHORIZED") {
      console.log("  ✅ Non-Bearer Authorization header rejected with 401 UNAUTHORIZED");
    } else {
      throw new Error(`Expected 401 UNAUTHORIZED, got: ${malformedRes.status}`);
    }

    console.log("\n▶ TEST 7: Protected Route - Reject Tampered/Invalid JWT");
    const tamperedRes = await request("/api/auth/me", {
      headers: { Authorization: "Bearer eyJhbGciOiJIUzI1NiJ9.tampered.token" },
    });
    if (tamperedRes.status === 401 && tamperedRes.data.error.code === "UNAUTHORIZED") {
      console.log("  ✅ Tampered/invalid JWT rejected with 401 UNAUTHORIZED");
    } else {
      throw new Error(`Expected 401 UNAUTHORIZED, got: ${tamperedRes.status}`);
    }

    // 4. Test Valid Authenticated User Flow
    console.log("\n▶ TEST 8: Authenticated User Profile (GET /api/auth/me)");
    const testUser = await prisma.user.upsert({
      where: { email: "authtest@chessone.local" },
      update: {
        name: "Auth Test Player",
        googleId: "google-sub-998877",
        avatarUrl: "https://lh3.googleusercontent.com/test-avatar",
      },
      create: {
        name: "Auth Test Player",
        email: "authtest@chessone.local",
        googleId: "google-sub-998877",
        avatarUrl: "https://lh3.googleusercontent.com/test-avatar",
      },
    });

    const jwtToken = generateToken(testUser);
    const authHeaders = { Authorization: `Bearer ${jwtToken}` };

    const meRes = await request("/api/auth/me", {
      headers: authHeaders,
    });

    if (meRes.status === 200 && meRes.data.success && meRes.data.data?.user) {
      const u = meRes.data.data.user;
      if (typeof u.id !== "number" || !Number.isInteger(u.id)) {
        throw new Error(`Expected user.id to be an integer number, got: ${typeof u.id} (${u.id})`);
      }
      if (u.id === testUser.id && u.email === "authtest@chessone.local" && u.avatarUrl) {
        console.log(`  ✅ GET /api/auth/me returned authenticated user: ${u.name} (id: ${u.id}, type: integer)`);
      } else {
        throw new Error(`User data mismatch in /me: ${JSON.stringify(u)}`);
      }
    } else {
      throw new Error(`GET /api/auth/me failed: ${JSON.stringify(meRes.data)}`);
    }

    // 5. Game API Protected by JWT + Spoofing Protection
    console.log("\n▶ TEST 9: Protected Game Creation (POST /api/games)");
    const unauthGameRes = await request("/api/games", {
      method: "POST",
      body: { gameType: "PLAYER_VS_PLAYER", timeControl: "10+0" },
    });
    if (unauthGameRes.status === 401) {
      console.log("  ✅ Unauthenticated POST /api/games rejected with 401 UNAUTHORIZED");
    } else {
      throw new Error(`Expected 401 UNAUTHORIZED for unauth game create, got: ${unauthGameRes.status}`);
    }

    console.log("\n▶ TEST 10: Anti-Spoofing: Backend derives createdBy exclusively from JWT");
    // Client tries to spoof createdBy / userId / playerId as another user ID (999999)
    const spoofAttemptRes = await request("/api/games", {
      method: "POST",
      headers: authHeaders,
      body: {
        gameType: "PLAYER_VS_PLAYER",
        timeControl: "10+0",
        createdBy: 999999,
        userId: 999999,
        playerId: 999999,
      },
    });

    if (spoofAttemptRes.status === 201 && spoofAttemptRes.data.success) {
      const createdGameSummary = spoofAttemptRes.data.game;
      // Fetch the created game from DB to verify createdBy is testUser.id
      const dbGame = await prisma.game.findUnique({
        where: { id: createdGameSummary.gameId },
      });

      if (typeof dbGame.createdBy !== "number" || !Number.isInteger(dbGame.createdBy)) {
        throw new Error(`Expected dbGame.createdBy to be integer, got: ${typeof dbGame.createdBy}`);
      }

      if (dbGame && dbGame.createdBy === testUser.id) {
        console.log(`  ✅ Game created in DB with createdBy = ${dbGame.createdBy} (integer type, spoofed 999999 ignored)`);
      } else {
        throw new Error(`Spoofing succeeded! createdBy was ${dbGame?.createdBy} instead of ${testUser.id}`);
      }
    } else {
      throw new Error(`Game creation failed: ${JSON.stringify(spoofAttemptRes.data)}`);
    }

    // 6. Test GET /api/games/:gameId with JWT
    console.log("\n▶ TEST 11: Protected Game Fetch (GET /api/games/:gameId)");
    const gameId = spoofAttemptRes.data.game.gameId;
    const fetchGameRes = await request(`/api/games/${gameId}`, {
      headers: authHeaders,
    });

    if (fetchGameRes.status === 200 && fetchGameRes.data.success && fetchGameRes.data.game) {
      const g = fetchGameRes.data.game;
      if (typeof g.creator?.id !== "number" || !Number.isInteger(g.creator?.id)) {
        throw new Error(`Expected g.creator.id to be integer, got: ${typeof g.creator?.id}`);
      }
      if (g.creator?.id === testUser.id) {
        console.log(`  ✅ Successfully fetched game ${gameId} with JWT. Creator: ${g.creator.name} (id: ${g.creator.id}, type: integer)`);
      } else {
        throw new Error(`Creator mismatch in fetched game: ${JSON.stringify(g.creator)}`);
      }
    } else {
      throw new Error(`Failed to fetch game with JWT: ${JSON.stringify(fetchGameRes.data)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL AUTHENTICATION TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================\n");
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runAuthTestSuite().catch((err) => {
  console.error("\n❌ AUTH TEST SUITE FAILED:", err);
  process.exit(1);
});
