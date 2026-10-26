const http = require("http");
const { io: ClientIO } = require("socket.io-client");
const app = require("./app");
const prisma = require("./config/database");
const { initializeSocket } = require("./socket");

const TEST_PORT = 4993;
let server = null;
let passed = 0;
let failed = 0;

function check(testNum, who, action, expected, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(
      `| ${String(testNum).padEnd(2)} | ${String(who).padEnd(12)} | ${String(action).padEnd(46)} | ${String(expected).padEnd(28)} | PASS | ${detail}`
    );
  } else {
    failed++;
    console.error(
      `| ${String(testNum).padEnd(2)} | ${String(who).padEnd(12)} | ${String(action).padEnd(46)} | ${String(expected).padEnd(28)} | FAIL | ${detail}`
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

async function devLogin(baseUrl, email, role = "STUDENT") {
  // Ensure user has correct role in DB
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role !== role) {
      await prisma.user.update({
        where: { email },
        data: { role, onboardingDone: true },
      });
    }
  } else {
    await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        role,
        onboardingDone: true,
      },
    });
  }

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

async function runTournamentStartTests() {
  console.log("==================================================");
  console.log("🏆 ChessOne — Phase 2 Tournament Start Test Suite");
  console.log("==================================================");

  // Setup Server & Socket.IO
  server = http.createServer(app);
  initializeSocket(server);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}`;
  console.log(`[SETUP] Test server running on port ${TEST_PORT}\n`);

  const createdTournamentIds = [];
  const createdGameIds = [];

  try {
    // Authenticate test users
    const organiser = await devLogin(baseUrl, "organiser@chessone.local", "ORGANISER");
    const organiser2 = await devLogin(baseUrl, "organiser2@chessone.local", "ORGANISER");
    const student1 = await devLogin(baseUrl, "student1@chessone.local", "STUDENT");
    const student2 = await devLogin(baseUrl, "student2@chessone.local", "STUDENT");
    const student3 = await devLogin(baseUrl, "student3@chessone.local", "STUDENT");
    const student4 = await devLogin(baseUrl, "student4@chessone.local", "STUDENT");
    const student5 = await devLogin(baseUrl, "student5@chessone.local", "STUDENT");
    const outsider = await devLogin(baseUrl, "outsider@chessone.local", "STUDENT");

    console.log("-".repeat(125));
    console.log(
      `| ${"#".padEnd(2)} | ${"Who".padEnd(12)} | ${"Action".padEnd(46)} | ${"Expected".padEnd(28)} | Result | Details`
    );
    console.log("-".repeat(125));

    // Tomorrow startsAt
    const tomorrow = new Date(Date.now() + 86400000).toISOString();

    // 1. Organiser creates T (8 max); students 1-4 join
    const createRes = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: {
        name: "[TEST] Winter Championship",
        maxPlayers: 8,
        timeControl: "10+0",
        startsAt: tomorrow,
      },
    });
    const tId = createRes.data?.tournament?.id;
    if (tId) createdTournamentIds.push(tId);

    await makeRequest(baseUrl, `/api/tournaments/${tId}/join`, { method: "POST", headers: student1.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${tId}/join`, { method: "POST", headers: student2.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${tId}/join`, { method: "POST", headers: student3.authHeader });
    const join4 = await makeRequest(baseUrl, `/api/tournaments/${tId}/join`, { method: "POST", headers: student4.authHeader });

    const pCount = join4.data?.tournament?.playerCount;
    check(
      1,
      "organiser",
      "creates T (8 max); students 1-4 join",
      "4 players",
      createRes.status === 201 && pCount === 4,
      `id=${tId}, players=${pCount}`
    );

    // 2. organiser2 -> start T -> 403
    const startOrg2 = await makeRequest(baseUrl, `/api/tournaments/${tId}/start`, {
      method: "POST",
      headers: organiser2.authHeader,
    });
    check(
      2,
      "organiser2",
      "start T",
      "403 FORBIDDEN",
      startOrg2.status === 403,
      `status=${startOrg2.status}`
    );

    // 3. student1 -> start T -> 403
    const startS1 = await makeRequest(baseUrl, `/api/tournaments/${tId}/start`, {
      method: "POST",
      headers: student1.authHeader,
    });
    check(
      3,
      "student1",
      "start T",
      "403 FORBIDDEN",
      startS1.status === 403,
      `status=${startS1.status}`
    );

    // 4. organiser -> start T -> 200, ACTIVE, currentRound 1, totalRounds 3
    const startRes = await makeRequest(baseUrl, `/api/tournaments/${tId}/start`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    const tData = startRes.data?.tournament;
    check(
      4,
      "organiser",
      "start T",
      "200, ACTIVE, r1, total 3",
      startRes.status === 200 &&
        tData?.status === "ACTIVE" &&
        tData?.currentRound === 1 &&
        tData?.totalRounds === 3,
      `status=${tData?.status}, round=${tData?.currentRound}, total=${tData?.totalRounds}`
    );

    // 5. organiser -> start T again -> 409 TOURNAMENT_ALREADY_STARTED
    const startAgain = await makeRequest(baseUrl, `/api/tournaments/${tId}/start`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    check(
      5,
      "organiser",
      "start T again",
      "409 ALREADY_STARTED",
      startAgain.status === 409,
      `status=${startAgain.status}, code=${startAgain.data?.error?.code}`
    );

    // 6. organiser (two parallel starts on a fresh T2) -> Promise.all -> exactly one 200
    const createT2 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: { name: "[TEST] Parallel Start T2", maxPlayers: 8, timeControl: "10+0", startsAt: tomorrow },
    });
    const t2Id = createT2.data?.tournament?.id;
    if (t2Id) createdTournamentIds.push(t2Id);
    await makeRequest(baseUrl, `/api/tournaments/${t2Id}/join`, { method: "POST", headers: student1.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t2Id}/join`, { method: "POST", headers: student2.authHeader });

    const [parallel1, parallel2] = await Promise.all([
      makeRequest(baseUrl, `/api/tournaments/${t2Id}/start`, { method: "POST", headers: organiser.authHeader }),
      makeRequest(baseUrl, `/api/tournaments/${t2Id}/start`, { method: "POST", headers: organiser.authHeader }),
    ]);
    const pSuccessCount = (parallel1.status === 200 ? 1 : 0) + (parallel2.status === 200 ? 1 : 0);
    const pConflictCount = (parallel1.status === 409 ? 1 : 0) + (parallel2.status === 409 ? 1 : 0);
    check(
      6,
      "organiser",
      "parallel start on fresh T2",
      "exactly one 200",
      pSuccessCount === 1 && pConflictCount === 1,
      `success=${pSuccessCount}, conflict=${pConflictCount}`
    );

    // 7. any -> GET rounds/1 -> 2 boards, both with gameId, 4 different players
    const round1Res = await makeRequest(baseUrl, `/api/tournaments/${tId}/rounds/1`, {
      method: "GET",
      headers: student1.authHeader,
    });
    const round1Pairings = round1Res.data?.round?.pairings || [];
    const allPlayersInR1 = new Set();
    let bothHaveGameId = round1Pairings.length === 2;
    for (const p of round1Pairings) {
      if (!p.gameId) bothHaveGameId = false;
      if (p.white?.id) allPlayersInR1.add(p.white.id);
      if (p.black?.id) allPlayersInR1.add(p.black.id);
    }
    check(
      7,
      "any",
      "GET rounds/1",
      "2 boards with games, 4 players",
      round1Res.status === 200 && bothHaveGameId && allPlayersInR1.size === 4,
      `boards=${round1Pairings.length}, uniquePlayers=${allPlayersInR1.size}`
    );

    // 8. any -> each game in the DB -> status ACTIVE, gameType PVP, tournamentId = T
    const board1 = round1Pairings[0];
    const board2 = round1Pairings[1];
    if (board1?.gameId) createdGameIds.push(board1.gameId);
    if (board2?.gameId) createdGameIds.push(board2.gameId);

    const dbGame1 = await prisma.game.findUnique({ where: { id: board1.gameId } });
    const dbGame2 = await prisma.game.findUnique({ where: { id: board2.gameId } });
    const gamesValid =
      dbGame1?.status === "ACTIVE" &&
      dbGame1?.gameType === "PLAYER_VS_PLAYER" &&
      dbGame1?.tournamentId === tId &&
      dbGame2?.status === "ACTIVE" &&
      dbGame2?.gameType === "PLAYER_VS_PLAYER" &&
      dbGame2?.tournamentId === tId;
    check(
      8,
      "any",
      "each game in DB verified",
      "ACTIVE, PVP, tournamentId=T",
      gamesValid,
      `g1=${dbGame1?.id}, g2=${dbGame2?.id}`
    );

    // 9. student1 -> GET my-game -> own gameId + colour; opponent matches round 1
    const s1MyGame = await makeRequest(baseUrl, `/api/tournaments/${tId}/my-game`, {
      method: "GET",
      headers: student1.authHeader,
    });
    const s1Data = s1MyGame.data;
    const s1Pairing = round1Pairings.find((p) => p.white?.id === student1.user.id || p.black?.id === student1.user.id);
    const expectedColor = s1Pairing?.white?.id === student1.user.id ? "WHITE" : "BLACK";
    const expectedOpponentId = expectedColor === "WHITE" ? s1Pairing?.black?.id : s1Pairing?.white?.id;
    const s1Matches =
      s1MyGame.status === 200 &&
      s1Data?.gameId === s1Pairing?.gameId &&
      s1Data?.color === expectedColor &&
      s1Data?.opponent?.id === expectedOpponentId;
    check(
      9,
      "student1",
      "GET my-game",
      "own gameId, color & opponent",
      s1Matches,
      `gameId=${s1Data?.gameId}, color=${s1Data?.color}, opp=${s1Data?.opponent?.id}`
    );

    // 10. organiser -> GET my-game -> 404 NOT_IN_TOURNAMENT
    const orgMyGame = await makeRequest(baseUrl, `/api/tournaments/${tId}/my-game`, {
      method: "GET",
      headers: organiser.authHeader,
    });
    check(
      10,
      "organiser",
      "GET my-game",
      "404 NOT_IN_TOURNAMENT",
      orgMyGame.status === 404 && orgMyGame.data?.error?.code === "NOT_IN_TOURNAMENT",
      `status=${orgMyGame.status}, code=${orgMyGame.data?.error?.code}`
    );

    // Find Board 1 White and Black players and outsider
    const b1WhiteUser = board1.white.id === student1.user.id ? student1 : board1.white.id === student2.user.id ? student2 : board1.white.id === student3.user.id ? student3 : student4;
    const b1BlackUser = board1.black.id === student1.user.id ? student1 : board1.black.id === student2.user.id ? student2 : board1.black.id === student3.user.id ? student3 : student4;
    const otherStudent = [student1, student2, student3, student4].find(
      (s) => s.user.id !== board1.white.id && s.user.id !== board1.black.id
    );

    // 11. a student not on board 1 -> make a move in board 1's game -> 403
    const moveFromNonPlayer = await makeRequest(baseUrl, `/api/games/${board1.gameId}/moves`, {
      method: "POST",
      headers: otherStudent.authHeader,
      body: { from: "e2", to: "e4" },
    });
    check(
      11,
      "non-player",
      "move in board 1 game",
      "403 NOT_A_PLAYER",
      moveFromNonPlayer.status === 403,
      `status=${moveFromNonPlayer.status}, code=${moveFromNonPlayer.data?.error?.code}`
    );

    // 12. board 1 White player -> make a legal move -> 200
    const legalMoveRes = await makeRequest(baseUrl, `/api/games/${board1.gameId}/moves`, {
      method: "POST",
      headers: b1WhiteUser.authHeader,
      body: { from: "e2", to: "e4" },
    });
    check(
      12,
      "b1 White",
      "make legal move e2->e4",
      "200 OK",
      legalMoveRes.status === 200,
      `status=${legalMoveRes.status}`
    );

    // 13. board 1 Black player -> abort board 1 game -> 403 TOURNAMENT_GAME_LOCKED
    const abortRes = await makeRequest(baseUrl, `/api/games/${board1.gameId}/abort`, {
      method: "POST",
      headers: b1BlackUser.authHeader,
    });
    check(
      13,
      "b1 Black",
      "abort board 1 game",
      "403 TOURNAMENT_GAME_LOCKED",
      abortRes.status === 403 && abortRes.data?.error?.code === "TOURNAMENT_GAME_LOCKED",
      `status=${abortRes.status}, code=${abortRes.data?.error?.code}`
    );

    // 14. organiser -> cancel board 1 game -> 403 TOURNAMENT_GAME_LOCKED
    const cancelGameRes = await makeRequest(baseUrl, `/api/games/${board1.gameId}/cancel`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    check(
      14,
      "organiser",
      "cancel board 1 game",
      "403 TOURNAMENT_GAME_LOCKED",
      cancelGameRes.status === 403 && cancelGameRes.data?.error?.code === "TOURNAMENT_GAME_LOCKED",
      `status=${cancelGameRes.status}, code=${cancelGameRes.data?.error?.code}`
    );

    // 15. outsider student -> join board 1 game by code -> 403 NOT_A_PLAYER
    const b1Code = dbGame1.gameCode;
    const joinCodeRes = await makeRequest(baseUrl, `/api/games/${b1Code}/join`, {
      method: "POST",
      headers: outsider.authHeader,
    });
    check(
      15,
      "outsider",
      "join board 1 by code",
      "403 NOT_A_PLAYER",
      joinCodeRes.status === 403 && joinCodeRes.data?.error?.code === "NOT_A_PLAYER",
      `status=${joinCodeRes.status}, code=${joinCodeRes.data?.error?.code}`
    );

    // 16. student (new) -> join T after start -> 409 TOURNAMENT_NOT_OPEN
    const joinAfterStart = await makeRequest(baseUrl, `/api/tournaments/${tId}/join`, {
      method: "POST",
      headers: outsider.authHeader,
    });
    check(
      16,
      "new student",
      "join T after start",
      "409 TOURNAMENT_NOT_OPEN",
      joinAfterStart.status === 409 && joinAfterStart.data?.error?.code === "TOURNAMENT_NOT_OPEN",
      `status=${joinAfterStart.status}, code=${joinAfterStart.data?.error?.code}`
    );

    // 17. student1 -> leave T after start -> 409 TOURNAMENT_NOT_OPEN
    const leaveAfterStart = await makeRequest(baseUrl, `/api/tournaments/${tId}/leave`, {
      method: "POST",
      headers: student1.authHeader,
    });
    check(
      17,
      "student1",
      "leave T after start",
      "409 TOURNAMENT_NOT_OPEN",
      leaveAfterStart.status === 409 && leaveAfterStart.data?.error?.code === "TOURNAMENT_NOT_OPEN",
      `status=${leaveAfterStart.status}, code=${leaveAfterStart.data?.error?.code}`
    );

    // 18. T3 with 5 players -> start -> totalRounds 5; round 1 has 2 games + 1 BYE; the bye player's score is 1, hadBye true; that player's my-game -> { bye: true }
    const createT3 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: { name: "[TEST] 5-Player Round Robin T3", maxPlayers: 8, timeControl: "10+0", startsAt: tomorrow },
    });
    const t3Id = createT3.data?.tournament?.id;
    if (t3Id) createdTournamentIds.push(t3Id);

    await makeRequest(baseUrl, `/api/tournaments/${t3Id}/join`, { method: "POST", headers: student1.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t3Id}/join`, { method: "POST", headers: student2.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t3Id}/join`, { method: "POST", headers: student3.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t3Id}/join`, { method: "POST", headers: student4.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t3Id}/join`, { method: "POST", headers: student5.authHeader });

    const startT3 = await makeRequest(baseUrl, `/api/tournaments/${t3Id}/start`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    const r1T3 = await makeRequest(baseUrl, `/api/tournaments/${t3Id}/rounds/1`, {
      method: "GET",
      headers: student1.authHeader,
    });

    const t3Pairings = r1T3.data?.round?.pairings || [];
    const realGamesT3 = t3Pairings.filter((p) => p.black !== null && p.gameId !== null);
    const byePairingT3 = t3Pairings.find((p) => p.black === null && p.result === "BYE");

    let byePlayerValid = false;
    let byeMyGameValid = false;

    if (byePairingT3) {
      const byeUserId = byePairingT3.white.id;
      const byeEntry = await prisma.tournamentPlayer.findUnique({
        where: { tournamentId_userId: { tournamentId: t3Id, userId: byeUserId } },
      });
      byePlayerValid = byeEntry?.score === 1 && byeEntry?.hadBye === true;

      const byeUser = [student1, student2, student3, student4, student5].find((s) => s.user.id === byeUserId);
      const myGameRes = await makeRequest(baseUrl, `/api/tournaments/${t3Id}/my-game`, {
        method: "GET",
        headers: byeUser.authHeader,
      });
      byeMyGameValid = myGameRes.status === 200 && myGameRes.data?.bye === true;
    }

    const t3Valid =
      startT3.status === 200 &&
      startT3.data?.tournament?.totalRounds === 5 &&
      realGamesT3.length === 2 &&
      Boolean(byePairingT3) &&
      byePlayerValid &&
      byeMyGameValid;

    check(
      18,
      "organiser",
      "5-player T3 start (rounds 5, 2 games, 1 bye)",
      "total 5, bye score 1, hadBye",
      t3Valid,
      `realGames=${realGamesT3.length}, byeValid=${byePlayerValid}, myGameBye=${byeMyGameValid}`
    );

    // 19. T4 with 1 player -> start -> 409 NOT_ENOUGH_PLAYERS
    const createT4 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: { name: "[TEST] 1-Player T4", maxPlayers: 8, timeControl: "10+0", startsAt: tomorrow },
    });
    const t4Id = createT4.data?.tournament?.id;
    if (t4Id) createdTournamentIds.push(t4Id);
    await makeRequest(baseUrl, `/api/tournaments/${t4Id}/join`, { method: "POST", headers: student1.authHeader });

    const startT4 = await makeRequest(baseUrl, `/api/tournaments/${t4Id}/start`, {
      method: "POST",
      headers: organiser.authHeader,
    });
    check(
      19,
      "organiser",
      "start T4 with 1 player",
      "409 NOT_ENOUGH_PLAYERS",
      startT4.status === 409 && startT4.data?.error?.code === "NOT_ENOUGH_PLAYERS",
      `status=${startT4.status}, code=${startT4.data?.error?.code}`
    );

    // 20. GET rounds/9 on T -> 404 ROUND_NOT_FOUND
    const round9Res = await makeRequest(baseUrl, `/api/tournaments/${tId}/rounds/9`, {
      method: "GET",
      headers: student1.authHeader,
    });
    check(
      20,
      "any",
      "GET rounds/9 on T",
      "404 ROUND_NOT_FOUND",
      round9Res.status === 404 && round9Res.data?.error?.code === "ROUND_NOT_FOUND",
      `status=${round9Res.status}, code=${round9Res.data?.error?.code}`
    );

    // 21. socket client joins tournament:<T5> then organiser starts T5 -> receives tournament:round-started
    const createT5 = await makeRequest(baseUrl, "/api/tournaments", {
      method: "POST",
      headers: organiser.authHeader,
      body: { name: "[TEST] Socket Test T5", maxPlayers: 8, timeControl: "10+0", startsAt: tomorrow },
    });
    const t5Id = createT5.data?.tournament?.id;
    if (t5Id) createdTournamentIds.push(t5Id);
    await makeRequest(baseUrl, `/api/tournaments/${t5Id}/join`, { method: "POST", headers: student1.authHeader });
    await makeRequest(baseUrl, `/api/tournaments/${t5Id}/join`, { method: "POST", headers: student2.authHeader });

    const clientSocket = ClientIO(baseUrl, {
      auth: { token: student1.token },
      transports: ["websocket"],
      forceNew: true,
    });

    const socketReceivedPromise = new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 5000);
      clientSocket.on("tournament:round-started", (payload) => {
        clearTimeout(timeout);
        resolve(payload);
      });
    });

    await new Promise((res) => {
      clientSocket.on("connect", () => {
        clientSocket.emit("tournament:join", { tournamentId: t5Id }, () => {
          res();
        });
      });
    });

    // Organiser starts T5
    await makeRequest(baseUrl, `/api/tournaments/${t5Id}/start`, {
      method: "POST",
      headers: organiser.authHeader,
    });

    const socketPayload = await socketReceivedPromise;
    clientSocket.disconnect();

    const socketOk =
      socketPayload &&
      socketPayload.tournamentId === t5Id &&
      socketPayload.roundNumber === 1 &&
      Array.isArray(socketPayload.pairings) &&
      socketPayload.pairings.length > 0;

    check(
      21,
      "socket client",
      "receives tournament:round-started on start",
      "event with pairings",
      socketOk,
      `received=${Boolean(socketPayload)}, pairings=${socketPayload?.pairings?.length}`
    );

    // 22. a normal (non-tournament) game -> abort -> still works as before
    const createNormalGame = await makeRequest(baseUrl, "/api/games", {
      method: "POST",
      headers: student1.authHeader,
      body: { gameType: "PLAYER_VS_PLAYER", timeControl: "10+0" },
    });
    const normalGameId = createNormalGame.data?.game?.gameId || createNormalGame.data?.gameId;
    if (normalGameId) createdGameIds.push(normalGameId);

    const abortNormalRes = await makeRequest(baseUrl, `/api/games/${normalGameId}/abort`, {
      method: "POST",
      headers: student1.authHeader,
    });
    check(
      22,
      "student1",
      "abort normal non-tournament game",
      "200 OK CANCELLED",
      abortNormalRes.status === 200 && abortNormalRes.data?.status === "CANCELLED",
      `status=${abortNormalRes.status}, gameStatus=${abortNormalRes.data?.status}`
    );

    console.log("-".repeat(125));
  } catch (err) {
    console.error("Test execution error:", err);
    failed++;
  } finally {
    // Cleanup test data
    try {
      if (createdGameIds.length > 0) {
        await prisma.gameMove.deleteMany({ where: { gameId: { in: createdGameIds } } });
        await prisma.tournamentPairing.deleteMany({ where: { gameId: { in: createdGameIds } } });
        await prisma.game.deleteMany({ where: { id: { in: createdGameIds } } });
      }
      if (createdTournamentIds.length > 0) {
        await prisma.tournament.deleteMany({ where: { id: { in: createdTournamentIds } } });
      }
    } catch (cleanupErr) {
      console.warn("Cleanup warning:", cleanupErr.message);
    }

    if (server) {
      server.close();
    }
  }

  console.log("==================================================");
  console.log(`Summary: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTournamentStartTests();
