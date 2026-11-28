const http = require("http");
const app = require("./app");
const prisma = require("./config/database");

const TEST_PORT = 4992;
let server = null;
let passed = 0;
let failed = 0;

function check(testNum, who, action, expected, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(
      `| ${String(testNum).padEnd(2)} | ${String(who).padEnd(10)} | ${String(action).padEnd(46)} | ${String(expected).padEnd(26)} | PASS | ${detail}`
    );
  } else {
    failed++;
    console.error(
      `| ${String(testNum).padEnd(2)} | ${String(who).padEnd(10)} | ${String(action).padEnd(46)} | ${String(expected).padEnd(26)} | FAIL | ${detail}`
    );
  }
}

async function makeRequest(baseUrl, path, options = {}) {
  const url = `${baseUrl}${path}`;
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
    data = { raw: text };
  }
  return { status: res.status, ok: res.ok, data };
}

async function devLogin(baseUrl, email) {
  const res = await makeRequest(baseUrl, "/api/auth/dev-login", {
    method: "POST",
    body: { email },
  });
  if (!res.ok || !res.data?.token) {
    throw new Error(`Failed to dev-login with ${email}: ${JSON.stringify(res.data)}`);
  }
  return {
    token: res.data.token,
    user: res.data.user,
    authHeader: { Authorization: `Bearer ${res.data.token}` },
  };
}

async function runTournamentTests() {
  console.log("==================================================");
  console.log("🏆 ChessOne — Phase 1 Tournaments Test Suite");
  console.log("==================================================");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;
  console.log(`[SETUP] Test server running on port ${TEST_PORT}\n`);

  let tournamentId = null;

  try {
    // 0. Authenticate seeded users
    const organiser = await devLogin(baseUrl, "organiser@chessone.local");
    const organiser2 = await devLogin(baseUrl, "organiser2@chessone.local");
    const admin = await devLogin(baseUrl, "admin@chessone.local");
    const student1 = await devLogin(baseUrl, "student1@chessone.local");
    const student2 = await devLogin(baseUrl, "student2@chessone.local");
    const student3 = await devLogin(baseUrl, "student3@chessone.local");
    const student4 = await devLogin(baseUrl, "student4@chessone.local");
    const parent = await devLogin(baseUrl, "parent@chessone.local");

    // Clean up any previous test tournaments
    await prisma.tournament.deleteMany({
      where: { name: { startsWith: "[TEST]" } },
    });

    console.log("----------------------------------------------------------------------------------------------------------------------------");
    console.log("| #  | Who        | Action                                         | Expected                   | Result | Details             |");
    console.log("----------------------------------------------------------------------------------------------------------------------------");

    // 1 | organiser | create (maxPlayers 3) | 201, status UPCOMING, isOwner true
    const startsAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const createRes = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: {
        name: "[TEST] Rapid Invitational",
        description: "Test tournament for RBAC and joining",
        format: "ROUND_ROBIN",
        timeControl: "10+0",
        maxPlayers: 3,
        startsAt,
        isRated: true,
      },
    });

    tournamentId = createRes.data?.tournament?.id;
    check(
      1,
      "organiser",
      "POST /api/tournaments (maxPlayers 3)",
      "201, UPCOMING, isOwner true",
      createRes.status === 201 &&
        createRes.data?.tournament?.status === "UPCOMING" &&
        createRes.data?.isOwner === true,
      `id=${tournamentId}, status=${createRes.data?.tournament?.status}`
    );

    // 2 | student1 | create | 403 FORBIDDEN
    const res2 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: student1.authHeader,
      body: {
        name: "[TEST] Student Tournament",
        timeControl: "10+0",
        maxPlayers: 4,
        startsAt,
      },
    });
    check(
      2,
      "student1",
      "POST /api/tournaments",
      "403 FORBIDDEN",
      res2.status === 403 && res2.data?.error?.code === "FORBIDDEN",
      `status=${res2.status}, code=${res2.data?.error?.code}`
    );

    // 3 | parent | create | 403
    const res3 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: parent.authHeader,
      body: {
        name: "[TEST] Parent Tournament",
        timeControl: "10+0",
        maxPlayers: 4,
        startsAt,
      },
    });
    check(
      3,
      "parent",
      "POST /api/tournaments",
      "403 FORBIDDEN",
      res3.status === 403 && res3.data?.error?.code === "FORBIDDEN",
      `status=${res3.status}, code=${res3.data?.error?.code}`
    );

    // 4 | student1, student2 | join | 200, playerCount 2
    const join1 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: student1.authHeader,
    });
    const join2 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: student2.authHeader,
    });
    check(
      4,
      "student1, 2",
      `POST /api/tournaments/${tournamentId}/join`,
      "200, playerCount 2",
      join1.status === 200 &&
        join2.status === 200 &&
        join2.data?.tournament?.playerCount === 2,
      `p1=${join1.status}, p2=${join2.status}, count=${join2.data?.tournament?.playerCount}`
    );

    // 5 | student1 | join again | 409 ALREADY_JOINED
    const joinDup = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: student1.authHeader,
    });
    check(
      5,
      "student1",
      `POST /api/tournaments/${tournamentId}/join (again)`,
      "409 ALREADY_JOINED",
      joinDup.status === 409 && joinDup.data?.error?.code === "ALREADY_JOINED",
      `status=${joinDup.status}, code=${joinDup.data?.error?.code}`
    );

    // 6 | parent | join | 403
    const parentJoin = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: parent.authHeader,
    });
    check(
      6,
      "parent",
      `POST /api/tournaments/${tournamentId}/join`,
      "403 FORBIDDEN",
      parentJoin.status === 403 && parentJoin.data?.error?.code === "FORBIDDEN",
      `status=${parentJoin.status}, code=${parentJoin.data?.error?.code}`
    );

    // 7 | organiser | join own | 403 (organiser has no JOIN permission)
    const organiserJoin = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    check(
      7,
      "organiser",
      `POST /api/tournaments/${tournamentId}/join (own)`,
      "403 FORBIDDEN",
      organiserJoin.status === 403 && organiserJoin.data?.error?.code === "FORBIDDEN",
      `status=${organiserJoin.status}, code=${organiserJoin.data?.error?.code}`
    );

    // 8 | admin | join organiser's, then leave | 200, then 200
    const adminJoin = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: admin.authHeader,
    });
    const adminLeave = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/leave`, {
      method: "POST",
      headers: admin.authHeader,
    });
    check(
      8,
      "admin",
      "join organiser's, then leave",
      "200, then 200",
      adminJoin.status === 200 && adminLeave.status === 200 && adminLeave.data?.tournament?.playerCount === 2,
      `join=${adminJoin.status}, leave=${adminLeave.status}, count=${adminLeave.data?.tournament?.playerCount}`
    );

    // 9 | student3 + student4 | join at the same time (Promise.all) when 1 spot is left
    const [race3, race4] = await Promise.all([
      makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
        method: "POST",
        headers: student3.authHeader,
      }),
      makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
        method: "POST",
        headers: student4.authHeader,
      }),
    ]);
    const one200 = (race3.status === 200 && race4.status === 409) || (race4.status === 200 && race3.status === 409);
    const oneFull = race3.data?.error?.code === "TOURNAMENT_FULL" || race4.data?.error?.code === "TOURNAMENT_FULL";
    check(
      9,
      "student3, 4",
      "concurrent join for last spot",
      "one 200, one 409 FULL",
      one200 && oneFull,
      `s3=${race3.status} (${race3.data?.error?.code || "OK"}), s4=${race4.status} (${race4.data?.error?.code || "OK"})`
    );

    // 10 | organiser2 | PATCH organiser's tournament | 403
    const res10 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: organiser2.authHeader,
      body: { description: "Malicious update" },
    });
    check(
      10,
      "organiser2",
      `PATCH /api/tournaments/${tournamentId}`,
      "403 FORBIDDEN",
      res10.status === 403 && res10.data?.error?.code === "FORBIDDEN",
      `status=${res10.status}, code=${res10.data?.error?.code}`
    );

    // 11 | admin | PATCH organiser's tournament | 200
    const res11 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: admin.authHeader,
      body: { description: "Updated by admin" },
    });
    check(
      11,
      "admin",
      `PATCH /api/tournaments/${tournamentId}`,
      "200 OK",
      res11.status === 200 && res11.data?.tournament?.description === "Updated by admin",
      `status=${res11.status}`
    );

    // 12 | organiser | PATCH maxPlayers 1 | 409 MAX_PLAYERS_TOO_LOW
    const res12 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}`, {
      method: "PATCH",
      headers: organiser.authHeader,
      body: { maxPlayers: 1 },
    });
    check(
      12,
      "organiser",
      `PATCH maxPlayers 1 (< playerCount 3)`,
      "409 MAX_PLAYERS_TOO_LOW",
      res12.status === 409 && res12.data?.error?.code === "MAX_PLAYERS_TOO_LOW",
      `status=${res12.status}, code=${res12.data?.error?.code}`
    );

    // 13 | student2 | leave | 200, playerCount drops
    const res13 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/leave`, {
      method: "POST",
      headers: student2.authHeader,
    });
    check(
      13,
      "student2",
      `POST /api/tournaments/${tournamentId}/leave`,
      "200, playerCount drops to 2",
      res13.status === 200 && res13.data?.tournament?.playerCount === 2,
      `status=${res13.status}, count=${res13.data?.tournament?.playerCount}`
    );

    // 14 | student2 | leave again | 404 NOT_JOINED
    const res14 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/leave`, {
      method: "POST",
      headers: student2.authHeader,
    });
    check(
      14,
      "student2",
      `POST /api/tournaments/${tournamentId}/leave (again)`,
      "404 NOT_JOINED",
      res14.status === 404 && res14.data?.error?.code === "NOT_JOINED",
      `status=${res14.status}, code=${res14.data?.error?.code}`
    );

    // 15 | student1 | GET /:id | isJoined true, canLeave true, canEdit false
    const res15 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}`, {
      headers: student1.authHeader,
    });
    check(
      15,
      "student1",
      `GET /api/tournaments/${tournamentId}`,
      "isJoined true, canLeave true, canEdit false",
      res15.status === 200 &&
        res15.data?.isJoined === true &&
        res15.data?.canLeave === true &&
        res15.data?.canEdit === false,
      `isJoined=${res15.data?.isJoined}, canLeave=${res15.data?.canLeave}, canEdit=${res15.data?.canEdit}`
    );

    // 16 | organiser & student1 | GET ?mine=true | contains it
    const orgMine = await makeRequest(baseUrl, `/api/tournaments?mine=true`, {
      headers: organiser.authHeader,
    });
    const s1Mine = await makeRequest(baseUrl, `/api/tournaments?mine=true`, {
      headers: student1.authHeader,
    });
    const orgHasIt = orgMine.data?.tournaments?.some((t) => t.id === tournamentId);
    const s1HasIt = s1Mine.data?.tournaments?.some((t) => t.id === tournamentId);
    check(
      16,
      "org & s1",
      "GET /api/tournaments?mine=true",
      "both lists contain it",
      orgMine.status === 200 && s1Mine.status === 200 && orgHasIt && s1HasIt,
      `orgHasIt=${orgHasIt}, s1HasIt=${s1HasIt}`
    );

    // 17 | organiser2 | cancel organiser's | 403
    const res17 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/cancel`, {
      method: "POST",
      headers: organiser2.authHeader,
    });
    check(
      17,
      "organiser2",
      `POST /api/tournaments/${tournamentId}/cancel`,
      "403 FORBIDDEN",
      res17.status === 403 && res17.data?.error?.code === "FORBIDDEN",
      `status=${res17.status}, code=${res17.data?.error?.code}`
    );

    // 18 | organiser | cancel | 200, CANCELLED; join after -> 409 TOURNAMENT_NOT_OPEN
    const res18 = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/cancel`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    const joinAfterCancel = await makeRequest(baseUrl, `/api/tournaments/${tournamentId}/join`, {
      method: "POST",
      headers: student2.authHeader,
    });
    check(
      18,
      "organiser",
      "cancel -> 200; join after -> 409 NOT_OPEN",
      "200 CANCELLED, then 409",
      res18.status === 200 &&
        res18.data?.tournament?.status === "CANCELLED" &&
        joinAfterCancel.status === 409 &&
        joinAfterCancel.data?.error?.code === "TOURNAMENT_NOT_OPEN",
      `status=${res18.data?.tournament?.status}, joinCode=${joinAfterCancel.data?.error?.code}`
    );

    // 19 | anyone | GET /api/tournaments/abc | 400 INVALID_ID
    const res19 = await makeRequest(baseUrl, "/api/tournaments/abc", {
      headers: student1.authHeader,
    });
    check(
      19,
      "anyone",
      "GET /api/tournaments/abc",
      "400 INVALID_ID",
      res19.status === 400 && res19.data?.error?.code === "INVALID_ID",
      `status=${res19.status}, code=${res19.data?.error?.code}`
    );

    // 20 | anyone | GET /api/tournaments/999999 | 404 TOURNAMENT_NOT_FOUND
    const res20 = await makeRequest(baseUrl, "/api/tournaments/999999", {
      headers: student1.authHeader,
    });
    check(
      20,
      "anyone",
      "GET /api/tournaments/999999",
      "404 TOURNAMENT_NOT_FOUND",
      res20.status === 404 && res20.data?.error?.code === "TOURNAMENT_NOT_FOUND",
      `status=${res20.status}, code=${res20.data?.error?.code}`
    );

    // 21 | organiser | create with startsAt in the past | 400
    const res21 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: {
        name: "[TEST] Past Tournament",
        timeControl: "10+0",
        maxPlayers: 4,
        startsAt: new Date(Date.now() - 3600000).toISOString(),
      },
    });
    check(
      21,
      "organiser",
      "POST /api/tournaments with past startsAt",
      "400 VALIDATION_ERROR",
      res21.status === 400 && res21.data?.error?.code === "VALIDATION_ERROR",
      `status=${res21.status}, code=${res21.data?.error?.code}`
    );

    console.log("----------------------------------------------------------------------------------------------------------------------------\n");

    console.log("==================================================");
    console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================\n");

    if (failed > 0) {
      process.exitCode = 1;
    }
  } catch (err) {
    console.error("Test execution failed:", err);
    process.exitCode = 1;
  } finally {
    // Cleanup created test tournaments
    try {
      await prisma.tournament.deleteMany({
        where: { name: { startsWith: "[TEST]" } },
      });
    } catch (_) {}

    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runTournamentTests();
