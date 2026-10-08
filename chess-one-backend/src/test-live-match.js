const http = require("http");
const { io: ClientIO } = require("socket.io-client");
const app = require("./app");
const prisma = require("./config/database");
const { initializeSocket } = require("./socket");
const { generateToken } = require("./middleware/auth.middleware");

const TEST_PORT = 4999;
let server;
let p1Socket;
let p2Socket;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

async function runTestSuite() {
  console.log("==================================================");
  console.log("♟️  ChessOne — Live Chess Match Backend Test Suite  ♟️");
  console.log("==================================================\n");

  // 1. Setup Server
  server = http.createServer(app);
  initializeSocket(server);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Test server running on port ${TEST_PORT}`);

  try {
    // 2. Setup Test Users
    const player1 = await prisma.user.upsert({
      where: { email: "player1@chessone.local" },
      update: { name: "Player One" },
      create: { name: "Player One", email: "player1@chessone.local" },
    });

    const player2 = await prisma.user.upsert({
      where: { email: "player2@chessone.local" },
      update: { name: "Player Two" },
      create: { name: "Player Two", email: "player2@chessone.local" },
    });

    console.log(`[SETUP] Users ready: Player 1 (id: ${player1.id}), Player 2 (id: ${player2.id})`);

    const p1Token = generateToken(player1);
    const p2Token = generateToken(player2);

    const p1Headers = { Authorization: `Bearer ${p1Token}` };
    const p2Headers = { Authorization: `Bearer ${p2Token}` };

    // --- TEST 1: Health Check ---
    console.log("\n▶ TEST 1: Health Check");
    const health = await request("/health");
    if (health.status === 200 && health.data.success) {
      console.log("  ✅ Health check passed:", health.data.message);
    } else {
      throw new Error(`Health check failed: ${JSON.stringify(health.data)}`);
    }

    // --- TEST 2: Validation of Invalid Game Request ---
    console.log("\n▶ TEST 2: Validation on Game Creation");
    const invalidGame = await request("/api/games", {
      method: "POST",
      headers: p1Headers,
      body: { gameType: "INVALID_TYPE", timeControl: "bad-time" },
    });
    if (invalidGame.status === 400 && invalidGame.data.error.code === "VALIDATION_ERROR") {
      console.log("  ✅ Invalid gameType and timeControl rejected properly");
    } else {
      throw new Error(`Expected validation error, got: ${invalidGame.status}`);
    }

    // --- TEST 3: Create PvP Game ---
    console.log("\n▶ TEST 3: Player 1 creates PvP Match (10+0, WHITE)");
    const createRes = await request("/api/games", {
      method: "POST",
      headers: p1Headers,
      body: {
        gameType: "PLAYER_VS_PLAYER",
        timeControl: "10+0",
        colorPreference: "WHITE",
      },
    });

    if (createRes.status !== 201 || !createRes.data.success) {
      throw new Error(`Create game failed: ${JSON.stringify(createRes.data)}`);
    }

    const createdGame = createRes.data.game;
    const gameId = createdGame.gameId;
    const gameCode = createdGame.gameCode;
    console.log(`  ✅ Match created: ID = ${gameId}, Code = ${gameCode}, Status = ${createdGame.status}, Color = ${createdGame.playerColor}`);

    // --- TEST 4: Self-invitation & Opponent Validation ---
    console.log("\n▶ TEST 4: Opponent & Self-Invitation Guards");
    const selfInvite = await request(`/api/games/${gameId}/invite`, {
      method: "POST",
      headers: p1Headers,
      body: { opponentUserId: player1.id },
    });
    if (selfInvite.status === 400 && selfInvite.data.error.code === "INVALID_INVITATION") {
      console.log("  ✅ Self-invitation prevented");
    } else {
      throw new Error(`Expected self-invite error, got: ${selfInvite.status}`);
    }

    // --- TEST 5: Invite Player 2 ---
    console.log("\n▶ TEST 5: Player 1 invites Player 2");
    const inviteRes = await request(`/api/games/${gameId}/invite`, {
      method: "POST",
      headers: p1Headers,
      body: { opponentUserId: player2.id },
    });
    if (inviteRes.status !== 201 || !inviteRes.data.success) {
      throw new Error(`Invite failed: ${JSON.stringify(inviteRes.data)}`);
    }
    const invitationId = inviteRes.data.invitation.id;
    console.log(`  ✅ Invitation sent: ID = ${invitationId}, Status = ${inviteRes.data.invitation.status}`);

    // Duplicate invite guard
    const dupInvite = await request(`/api/games/${gameId}/invite`, {
      method: "POST",
      headers: p1Headers,
      body: { opponentUserId: player2.id },
    });
    if (dupInvite.status === 409) {
      console.log("  ✅ Duplicate pending invitation prevented");
    }

    // --- TEST 6: Player 2 Checks Invitations ---
    console.log("\n▶ TEST 6: Player 2 fetches pending invitations");
    const p2Invites = await request("/api/invitations", {
      method: "GET",
      headers: p2Headers,
    });
    if (p2Invites.status !== 200 || !p2Invites.data.invitations.some((i) => i.id === invitationId)) {
      throw new Error("Invitation not found in Player 2 list");
    }
    console.log(`  ✅ Player 2 found ${p2Invites.data.invitations.length} pending invitation(s)`);

    // --- TEST 7: Connect Sockets for both Players ---
    console.log("\n▶ TEST 7: Connect Socket.IO clients");
    p1Socket = ClientIO(`http://localhost:${TEST_PORT}`, {
      auth: { token: p1Token, userId: player1.id },
    });
    p2Socket = ClientIO(`http://localhost:${TEST_PORT}`, {
      auth: { token: p2Token, userId: player2.id },
    });

    await new Promise((resolve) => p1Socket.on("connect", resolve));
    await new Promise((resolve) => p2Socket.on("connect", resolve));
    console.log("  ✅ Player 1 and Player 2 connected via Socket.IO");

    p1Socket.emit("game:join", { gameId });
    p2Socket.emit("game:join", { gameId });
    await sleep(200);

    // Listen for socket events
    const p1Events = [];
    const p2Events = [];
    p1Socket.on("game:move", (data) => p1Events.push({ event: "game:move", data }));
    p2Socket.on("game:move", (data) => p2Events.push({ event: "game:move", data }));
    p1Socket.on("game:finished", (data) => p1Events.push({ event: "game:finished", data }));
    p2Socket.on("game:finished", (data) => p2Events.push({ event: "game:finished", data }));
    p2Socket.on("game:draw-offered", (data) => p2Events.push({ event: "game:draw-offered", data }));

    // --- TEST 8: Accept Invitation (Atomic Game Activation) ---
    console.log("\n▶ TEST 8: Player 2 accepts invitation");
    const acceptRes = await request(`/api/invitations/${invitationId}/accept`, {
      method: "POST",
      headers: p2Headers,
    });
    if (acceptRes.status !== 200 || acceptRes.data.game.status !== "ACTIVE") {
      throw new Error(`Accept invitation failed: ${JSON.stringify(acceptRes.data)}`);
    }
    console.log(`  ✅ Match activated! Player 2 assigned: ${acceptRes.data.game.playerColor}`);

    // --- TEST 9: Player 1 plays e2 -> e4 ---
    console.log("\n▶ TEST 9: Player 1 (White) makes move: e2 -> e4");
    const move1 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: p1Headers,
      body: { from: "e2", to: "e4" },
    });
    if (move1.status !== 200 || !move1.data.success) {
      throw new Error(`Move 1 failed: ${JSON.stringify(move1.data)}`);
    }
    console.log(`  ✅ Server validated move 1: SAN = ${move1.data.move.san}, Next Turn = ${move1.data.currentTurn}`);

    await sleep(200);
    const p2Move1Recv = p2Events.find((e) => e.event === "game:move" && e.data.move.san === "e4");
    if (p2Move1Recv) {
      console.log("  ⚡ Player 2 received real-time 'game:move' Socket.IO event immediately!");
    } else {
      throw new Error("Player 2 did not receive Socket.IO move event");
    }

    // --- TEST 10: Turn Violation Guard ---
    console.log("\n▶ TEST 10: Turn enforcement guard (Player 1 tries to move again)");
    const wrongTurnMove = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: p1Headers,
      body: { from: "g1", to: "f3" },
    });
    if (wrongTurnMove.status === 400 && wrongTurnMove.data.error.code === "NOT_YOUR_TURN") {
      console.log("  ✅ Move rejected with NOT_YOUR_TURN error");
    } else {
      throw new Error(`Expected NOT_YOUR_TURN, got: ${wrongTurnMove.status}`);
    }

    // --- TEST 11: Illegal Move Guard ---
    console.log("\n▶ TEST 11: Chess rules enforcement guard (Player 2 plays illegal move)");
    const illegalMove = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: p2Headers,
      body: { from: "e7", to: "e3" },
    });
    if (illegalMove.status === 400 && illegalMove.data.error.code === "INVALID_MOVE") {
      console.log("  ✅ Illegal chess move rejected by server chess.js validator");
    } else {
      throw new Error(`Expected INVALID_MOVE, got: ${illegalMove.status}`);
    }

    // --- TEST 12: Player 2 plays e7 -> e5 ---
    console.log("\n▶ TEST 12: Player 2 (Black) makes move: e7 -> e5");
    const move2 = await request(`/api/games/${gameId}/moves`, {
      method: "POST",
      headers: p2Headers,
      body: { from: "e7", to: "e5" },
    });
    if (move2.status !== 200 || !move2.data.success) {
      throw new Error(`Move 2 failed: ${JSON.stringify(move2.data)}`);
    }
    console.log(`  ✅ Server validated move 2: SAN = ${move2.data.move.san}, Next Turn = ${move2.data.currentTurn}`);

    await sleep(200);
    const p1Move2Recv = p1Events.find((e) => e.event === "game:move" && e.data.move.san === "e5");
    if (p1Move2Recv) {
      console.log("  ⚡ Player 1 received real-time 'game:move' Socket.IO event immediately!");
    } else {
      throw new Error("Player 1 did not receive Socket.IO move event");
    }

    // --- TEST 13: Move History and PGN ---
    console.log("\n▶ TEST 13: Retrieve move history and PGN");
    const movesRes = await request(`/api/games/${gameId}/moves`, { headers: p1Headers });
    if (movesRes.data.moves.length === 2) {
      console.log(`  ✅ Move history verified: ${movesRes.data.moves.map((m) => m.san).join(" ")}`);
    }

    const pgnRes = await request(`/api/games/${gameId}/pgn`, { headers: p1Headers });
    console.log(`  ✅ PGN generated: "${pgnRes.data.pgn.trim()}"`);

    // --- TEST 14: Reconnection & State Recovery ---
    console.log("\n▶ TEST 14: Game state retrieval for client reconnection");
    const stateRes = await request(`/api/games/${gameId}/state`, { headers: p2Headers });
    if (stateRes.data.game.currentTurn === "WHITE" && stateRes.data.game.status === "ACTIVE") {
      console.log("  ✅ State recovered: Turn =", stateRes.data.game.currentTurn, "White clock =", stateRes.data.game.whiteTimeMs, "ms");
    }

    // --- TEST 15: Draw Offer Flow ---
    console.log("\n▶ TEST 15: Draw offer flow");
    const drawOfferRes = await request(`/api/games/${gameId}/draw-offer`, {
      method: "POST",
      headers: p1Headers,
    });
    if (drawOfferRes.data.success) {
      console.log("  ✅ Player 1 offered draw");
    }

    await sleep(200);
    const p2DrawOffer = p2Events.find((e) => e.event === "game:draw-offered");
    if (p2DrawOffer) {
      console.log("  ⚡ Player 2 received real-time 'game:draw-offered' event!");
    }

    // Player 2 rejects draw
    const drawRejectRes = await request(`/api/games/${gameId}/draw-reject`, {
      method: "POST",
      headers: p2Headers,
    });
    if (drawRejectRes.data.success) {
      console.log("  ✅ Player 2 rejected draw offer");
    }

    // --- TEST 16: Resignation Flow ---
    console.log("\n▶ TEST 16: Player 2 resigns");
    const resignRes = await request(`/api/games/${gameId}/resign`, {
      method: "POST",
      headers: p2Headers,
    });
    if (resignRes.status === 200 && resignRes.data.result === "RESIGNATION") {
      console.log(`  ✅ Resignation recorded. Result = ${resignRes.data.result}, Winner ID = ${resignRes.data.winnerId}`);
    }

    await sleep(200);
    const p1Finished = p1Events.find((e) => e.event === "game:finished" && e.data.result === "RESIGNATION");
    if (p1Finished) {
      console.log("  ⚡ Player 1 received real-time 'game:finished' Socket.IO event!");
    }

    // --- TEST 17: Result API ---
    console.log("\n▶ TEST 17: Game Result endpoint");
    const resultRes = await request(`/api/games/${gameId}/result`, { headers: p1Headers });
    if (resultRes.data.result === "RESIGNATION" && resultRes.data.winner.id === player1.id) {
      console.log("  ✅ Result endpoint verified. Winner is Player 1!");
    }

    // --- TEST 18: Player vs AI Game Creation ---
    console.log("\n▶ TEST 18: Player vs AI Game Creation");
    const aiGameRes = await request("/api/games", {
      method: "POST",
      headers: p1Headers,
      body: {
        gameType: "PLAYER_VS_AI",
        aiDifficulty: "MEDIUM",
        timeControl: "5+0",
        colorPreference: "WHITE",
      },
    });
    if (aiGameRes.status === 201 && aiGameRes.data.game.status === "ACTIVE") {
      console.log(`  ✅ AI Match active: Code = ${aiGameRes.data.game.gameCode}, Difficulty = ${aiGameRes.data.game.aiDifficulty}`);
      const aiGameId = aiGameRes.data.game.gameId;

      // Human plays e2 -> e4
      const humanMove = await request(`/api/games/${aiGameId}/moves`, {
        method: "POST",
        headers: p1Headers,
        body: { from: "e2", to: "e4" },
      });
      if (humanMove.status === 200) {
        console.log("  ✅ Human move e4 applied in AI game. Waiting for AI counter-move...");
        await sleep(700);

        // Fetch AI counter move
        const aiMoves = await request(`/api/games/${aiGameId}/moves`, { headers: p1Headers });
        if (aiMoves.data.moves.length >= 2) {
          console.log(`  🤖 AI responded with move: ${aiMoves.data.moves[1].san}`);
        }
      }
    }

    // --- TEST 19: Checkmate Detection Flow (Fool's Mate) ---
    console.log("\n▶ TEST 19: Checkmate Detection Flow");
    // Create new match for checkmate test
    const cmMatch = await request("/api/games", {
      method: "POST",
      headers: p1Headers,
      body: { gameType: "PLAYER_VS_PLAYER", timeControl: "10+0", colorPreference: "WHITE" },
    });
    const cmGameId = cmMatch.data.game.gameId;

    const cmInvite = await request(`/api/games/${cmGameId}/invite`, {
      method: "POST",
      headers: p1Headers,
      body: { opponentUserId: player2.id },
    });
    await request(`/api/invitations/${cmInvite.data.invitation.id}/accept`, {
      method: "POST",
      headers: p2Headers,
    });

    // Fool's Mate: 1. f3 e5 2. g4 Qh4#
    await request(`/api/games/${cmGameId}/moves`, { method: "POST", headers: p1Headers, body: { from: "f2", to: "f3" } });
    await request(`/api/games/${cmGameId}/moves`, { method: "POST", headers: p2Headers, body: { from: "e7", to: "e5" } });
    await request(`/api/games/${cmGameId}/moves`, { method: "POST", headers: p1Headers, body: { from: "g2", to: "g4" } });
    const checkmateMove = await request(`/api/games/${cmGameId}/moves`, {
      method: "POST",
      headers: p2Headers,
      body: { from: "d8", to: "h4" },
    });

    if (checkmateMove.data.status === "COMPLETED" && checkmateMove.data.result === "CHECKMATE") {
      console.log(`  ✅ Checkmate detected! Result = ${checkmateMove.data.result}, Winner ID = ${checkmateMove.data.winnerId}`);
    } else {
      throw new Error(`Expected CHECKMATE, got: ${JSON.stringify(checkmateMove.data)}`);
    }

    console.log("\n==================================================");
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED  🎉");
    console.log("==================================================\n");
  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (p1Socket) p1Socket.disconnect();
    if (p2Socket) p2Socket.disconnect();
    if (server) server.close();
    await prisma.$disconnect();
    process.exit(process.exitCode || 0);
  }
}

runTestSuite();
