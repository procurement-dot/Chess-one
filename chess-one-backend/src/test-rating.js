const http = require("http");
const app = require("./app");
const prisma = require("./config/database");
const { applyRating } = require("./services/rating.service");

const TEST_PORT = 4997;
let server;
let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`  PASS: ${name}${detail ? ` — ${detail}` : ""}`);
  } else {
    failed++;
    console.error(`  FAIL: ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

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

async function runRatingTests() {
  console.log("==================================================");
  console.log("🏆 ChessOne — Profile, Role & Elo Rating Test Suite");
  console.log("==================================================\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Test server running on port ${TEST_PORT}`);

  try {
    // 1. Dev-login two users and reset both to rating 1200, gamesPlayed 0
    console.log("\n▶ Step 1: Dev-login two users & reset rating=1200, gamesPlayed=0");
    const login1 = await request("/api/auth/dev-login", {
      method: "POST",
      body: { email: "rating_white@chessone.local" },
    });
    const login2 = await request("/api/auth/dev-login", {
      method: "POST",
      body: { email: "rating_black@chessone.local" },
    });

    check(
      "Dev-login returns role, rating, onboardingDone",
      login1.status === 200 &&
        typeof login1.data.user?.role === "string" &&
        typeof login1.data.user?.rating === "number" &&
        typeof login1.data.user?.onboardingDone === "boolean",
      `role=${login1.data.user?.role}, rating=${login1.data.user?.rating}, onboardingDone=${login1.data.user?.onboardingDone}`
    );

    const whiteUser = login1.data.user;
    const blackUser = login2.data.user;
    const whiteAuth = { Authorization: `Bearer ${login1.data.token}` };
    const blackAuth = { Authorization: `Bearer ${login2.data.token}` };

    await prisma.user.updateMany({
      where: { id: { in: [whiteUser.id, blackUser.id] } },
      data: {
        rating: 1200,
        gamesPlayed: 0,
        role: "STUDENT",
        onboardingDone: false,
      },
    });

    const resetCheck = await request("/api/users/me", { headers: whiteAuth });
    check(
      "GET /api/users/me returns reset profile (rating 1200, gamesPlayed 0)",
      resetCheck.status === 200 &&
        resetCheck.data.user?.rating === 1200 &&
        resetCheck.data.user?.gamesPlayed === 0,
      `rating=${resetCheck.data.user?.rating}, gamesPlayed=${resetCheck.data.user?.gamesPlayed}`
    );

    // 2. Create a PvP game, join it, and play Fool's mate (f3, e5, g4, Qh4#)
    console.log("\n▶ Step 2: Create PvP game, join & play Fool's mate (f3, e5, g4, Qh4#)");
    const createRes = await request("/api/games", {
      method: "POST",
      headers: whiteAuth,
      body: {
        gameType: "PLAYER_VS_PLAYER",
        timeControl: "10+0",
        colorPreference: "WHITE",
      },
    });
    const gameId = createRes.data.game?.gameId;
    check("PvP game created as WHITE", createRes.status === 201 && Boolean(gameId), `gameId=${gameId}`);

    const joinRes = await request(`/api/games/${gameId}/join`, {
      method: "POST",
      headers: blackAuth,
    });
    check("Second player joined as BLACK", joinRes.status === 200 && joinRes.data.game?.status === "ACTIVE");

    // Fool's mate moves: 1. f2->f3, e7->e5  2. g2->g4, d8->h4#
    const m1 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: whiteAuth,
      body: { from: "f2", to: "f3" },
    });
    const m2 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: blackAuth,
      body: { from: "e7", to: "e5" },
    });
    const m3 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: whiteAuth,
      body: { from: "g2", to: "g4" },
    });
    const m4 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: blackAuth,
      body: { from: "d8", to: "h4" },
    });

    check(
      "Fool's mate completed game with CHECKMATE",
      m1.ok && m2.ok && m3.ok && m4.ok && m4.data.status === "COMPLETED" && m4.data.result === "CHECKMATE",
      `status=${m4.data.status}, result=${m4.data.result}`
    );

    // 3. Assert: White rating 1180 (−20) and Black 1220 (+20). The game has ratingApplied = true
    console.log("\n▶ Step 3: Assert White=1180 (-20), Black=1220 (+20), ratingApplied=true");
    const whiteAfter = await prisma.user.findUnique({ where: { id: whiteUser.id } });
    const blackAfter = await prisma.user.findUnique({ where: { id: blackUser.id } });
    const ratedGame = await prisma.game.findUnique({ where: { id: gameId } });

    check(
      "White rating is 1180 (-20) and gamesPlayed = 1",
      whiteAfter.rating === 1180 &&
        ratedGame.whiteRatingChange === -20 &&
        whiteAfter.gamesPlayed === 1,
      `whiteRating=${whiteAfter.rating}, change=${ratedGame.whiteRatingChange}, gamesPlayed=${whiteAfter.gamesPlayed}`
    );

    check(
      "Black rating is 1220 (+20) and gamesPlayed = 1",
      blackAfter.rating === 1220 &&
        ratedGame.blackRatingChange === 20 &&
        blackAfter.gamesPlayed === 1,
      `blackRating=${blackAfter.rating}, change=${ratedGame.blackRatingChange}, gamesPlayed=${blackAfter.gamesPlayed}`
    );

    check(
      "Game has ratingApplied = true",
      ratedGame.ratingApplied === true,
      `ratingApplied=${ratedGame.ratingApplied}`
    );

    const resultApi = await request(`/api/games/${gameId}/result`, { headers: whiteAuth });
    check(
      "GET /api/games/:gameId/result includes rating object & player ratings",
      resultApi.status === 200 &&
        resultApi.data.rating?.applied === true &&
        resultApi.data.rating?.whiteRatingChange === -20 &&
        resultApi.data.rating?.blackRatingChange === 20 &&
        typeof resultApi.data.players?.white?.rating === "number",
      JSON.stringify(resultApi.data.rating)
    );

    // 4. Call applyRating(gameId) again and assert that ratings did not change
    console.log("\n▶ Step 4: Idempotency — call applyRating(gameId) again");
    const secondApply = await applyRating(gameId);
    const whiteAfterDup = await prisma.user.findUnique({ where: { id: whiteUser.id } });
    const blackAfterDup = await prisma.user.findUnique({ where: { id: blackUser.id } });

    check(
      "Second applyRating returns null and ratings remain 1180 / 1220",
      secondApply === null &&
        whiteAfterDup.rating === 1180 &&
        blackAfterDup.rating === 1220 &&
        whiteAfterDup.gamesPlayed === 1 &&
        blackAfterDup.gamesPlayed === 1,
      `secondApply=${secondApply}, white=${whiteAfterDup.rating}, black=${blackAfterDup.rating}`
    );

    // 5. Create a second game, resign, and assert the ratings changed again
    console.log("\n▶ Step 5: Second PvP game — Resign & verify rating updates again");
    const createRes2 = await request("/api/games", {
      method: "POST",
      headers: whiteAuth,
      body: {
        gameType: "PLAYER_VS_PLAYER",
        timeControl: "10+0",
        colorPreference: "WHITE",
      },
    });
    const gameId2 = createRes2.data.game?.gameId;
    await request(`/api/games/${gameId2}/join`, {
      method: "POST",
      headers: blackAuth,
    });

    const resignRes = await request(`/api/games/${gameId2}/resign`, {
      method: "POST",
      headers: blackAuth, // Black resigns -> White wins!
    });

    const whiteAfterGame2 = await prisma.user.findUnique({ where: { id: whiteUser.id } });
    const blackAfterGame2 = await prisma.user.findUnique({ where: { id: blackUser.id } });

    check(
      "Resignation updates ratings and increments gamesPlayed to 2",
      resignRes.status === 200 &&
        whiteAfterGame2.rating > 1180 &&
        blackAfterGame2.rating < 1220 &&
        whiteAfterGame2.gamesPlayed === 2 &&
        blackAfterGame2.gamesPlayed === 2,
      `white: 1180 -> ${whiteAfterGame2.rating} (+${resignRes.data.whiteRatingChange}), black: 1220 -> ${blackAfterGame2.rating} (${resignRes.data.blackRatingChange})`
    );

    // Verify AI game never changes ratings
    console.log("\n▶ Bonus Check: AI game does not change ratings");
    const aiGameRes = await request("/api/games", {
      method: "POST",
      headers: whiteAuth,
      body: {
        gameType: "PLAYER_VS_AI",
        timeControl: "10+0",
        colorPreference: "WHITE",
      },
    });
    const aiGameId = aiGameRes.data.game?.gameId;
    await request(`/api/games/${aiGameId}/finish-ai`, {
      method: "POST",
      headers: whiteAuth,
      body: {
        result: "CHECKMATE",
        winnerId: whiteUser.id,
      },
    });
    const aiApply = await applyRating(aiGameId);
    const whiteAfterAi = await prisma.user.findUnique({ where: { id: whiteUser.id } });
    check(
      "AI game never changes rating",
      aiApply === null && whiteAfterAi.rating === whiteAfterGame2.rating,
      `rating remained ${whiteAfterAi.rating}`
    );

    // 6. PATCH /api/users/me with role: "COACH" -> assert 403
    console.log("\n▶ Step 6: PATCH /api/users/me with privileged role COACH -> 403");
    const coachPatch = await request("/api/users/me", {
      method: "PATCH",
      headers: whiteAuth,
      body: { role: "COACH" },
    });
    check(
      'PATCH /api/users/me with role: "COACH" returns 403 ROLE_NOT_ALLOWED',
      coachPatch.status === 403 && coachPatch.data.error?.code === "ROLE_NOT_ALLOWED",
      `status=${coachPatch.status}, code=${coachPatch.data.error?.code}`
    );

    // 7. PATCH /api/users/me with role: "PARENT" -> assert 200 and onboardingDone: true
    console.log('\n▶ Step 7: PATCH /api/users/me with role: "PARENT" -> 200 & onboardingDone: true');
    const parentPatch = await request("/api/users/me", {
      method: "PATCH",
      headers: whiteAuth,
      body: {
        name: "Aarav Mehta",
        role: "PARENT",
        school: "Greenwood High",
        schoolClass: "5th grade",
        level: "Beginner",
        fideId: "",
        parentName: "Jane",
        parentEmail: "jane@x.com",
      },
    });

    check(
      'PATCH /api/users/me with role: "PARENT" returns 200, onboardingDone: true, and converts empty fideId to null',
      parentPatch.status === 200 &&
        parentPatch.data.user?.role === "PARENT" &&
        parentPatch.data.user?.onboardingDone === true &&
        parentPatch.data.user?.fideId === null &&
        parentPatch.data.user?.school === "Greenwood High",
      `role=${parentPatch.data.user?.role}, onboardingDone=${parentPatch.data.user?.onboardingDone}, fideId=${parentPatch.data.user?.fideId}`
    );

    console.log("\n==================================================");
    console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runRatingTests().catch((err) => {
  console.error("\n❌ RATING TEST SUITE ERROR:", err);
  process.exit(1);
});
