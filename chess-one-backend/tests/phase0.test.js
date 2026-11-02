const http = require("http");
const { execSync } = require("child_process");
const { io: ClientIO } = require("socket.io-client");
const app = require("../src/app");
const prisma = require("../src/config/database");
const env = require("../src/config/env");
const { initializeSocket } = require("../src/socket");
const { generateToken } = require("../src/utils/jwt");
const { requireAuth } = require("../src/middleware/auth.middleware");
const { requireRole } = require("../src/middleware/requireRole");
const {
  resolveClassId,
  requireClassMember,
  requireClassCoach,
} = require("../src/middleware/classAccess");
const { generateUniqueJoinCode, generateCode } = require("../src/utils/joinCode");

const TEST_PORT = 4996;
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
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runPhase0Tests() {
  console.log("==================================================");
  console.log("🛡️  ChessOne — Phase 0 Foundation Test Suite 🛡️");
  console.log("==================================================\n");

  const express = require("express");
  const cors = require("cors");
  const authRoutes = require("../src/routes/auth.routes");

  const testApp = express();
  testApp.use(cors());
  testApp.use(express.json());

  // Mount test endpoints
  testApp.get("/test/require-coach", requireAuth, requireRole("COACH"), (req, res) => {
    res.json({ success: true, user: req.user });
  });

  testApp.get(
    "/test/classes/:classId/member-only",
    requireAuth,
    resolveClassId,
    requireClassMember,
    (req, res) => {
      res.json({ success: true, classId: req.classId, classMember: req.classMember });
    }
  );

  testApp.get(
    "/test/classes/:classId/coach-only",
    requireAuth,
    resolveClassId,
    requireClassCoach,
    (req, res) => {
      res.json({ success: true, classId: req.classId, classMember: req.classMember });
    }
  );

  testApp.use("/api/auth", authRoutes);

  testApp.use((req, res) => {
    res.status(404).json({
      success: false,
      error: { code: "ROUTE_NOT_FOUND", message: "Not found" },
    });
  });

  server = http.createServer(testApp);
  initializeSocket(server);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Phase 0 test server listening on port ${TEST_PORT}`);

  try {
    // Setup test users
    const player1 = await prisma.user.upsert({
      where: { email: "player1@chessone.local" },
      update: { name: "Player One", role: "PLAYER" },
      create: { name: "Player One", email: "player1@chessone.local", role: "PLAYER" },
    });

    const player2 = await prisma.user.upsert({
      where: { email: "player2@chessone.local" },
      update: { name: "Player Two", role: "PLAYER" },
      create: { name: "Player Two", email: "player2@chessone.local", role: "PLAYER" },
    });

    const coach1 = await prisma.user.upsert({
      where: { email: "coach1@chessone.local" },
      update: { name: "Coach One", role: "COACH" },
      create: { name: "Coach One", email: "coach1@chessone.local", role: "COACH" },
    });

    const admin = await prisma.user.upsert({
      where: { email: "admin@chessone.local" },
      update: { name: "Admin User", role: "ADMIN" },
      create: { name: "Admin User", email: "admin@chessone.local", role: "ADMIN" },
    });

    const p1Token = generateToken(player1);
    const p2Token = generateToken(player2);
    const coachToken = generateToken(coach1);
    const adminToken = generateToken(admin);

    // TEST 1: dev-login with ENABLE_TEST_LOGIN=false -> 404
    console.log("\n▶ TEST 1: dev-login with ENABLE_TEST_LOGIN=false -> 404");
    env.ENABLE_TEST_LOGIN = "false";
    const t1Res = await request("/api/auth/dev-login", {
      method: "POST",
      body: { email: player1.email },
    });
    if (t1Res.status === 404 && t1Res.data?.error?.code === "ROUTE_NOT_FOUND") {
      console.log("  ✅ dev-login rejected with 404 ROUTE_NOT_FOUND when disabled");
    } else {
      throw new Error(`Test 1 failed: Expected 404 ROUTE_NOT_FOUND, got ${t1Res.status}`);
    }

    // TEST 2: dev-login with wrong/missing secret -> 404
    console.log("\n▶ TEST 2: dev-login with wrong/missing secret -> 404");
    env.ENABLE_TEST_LOGIN = "true";
    env.QA_LOGIN_SECRET = "super-secret-qa-key";
    env.QA_ALLOWED_EMAILS = [player1.email, coach1.email];

    const t2MissingSecret = await request("/api/auth/dev-login", {
      method: "POST",
      body: { email: player1.email },
    });
    const t2WrongSecret = await request("/api/auth/dev-login", {
      method: "POST",
      headers: { "x-qa-secret": "wrong-secret-key" },
      body: { email: player1.email },
    });
    if (
      t2MissingSecret.status === 404 &&
      t2MissingSecret.data?.error?.code === "ROUTE_NOT_FOUND" &&
      t2WrongSecret.status === 404 &&
      t2WrongSecret.data?.error?.code === "ROUTE_NOT_FOUND"
    ) {
      console.log("  ✅ dev-login rejected with 404 when secret is missing or invalid");
    } else {
      throw new Error("Test 2 failed: Missing/wrong secret must return 404 ROUTE_NOT_FOUND");
    }

    // TEST 3: dev-login with secret + allowed email -> 200, user.role present
    console.log("\n▶ TEST 3: dev-login with secret + allowed email -> 200, user.role present");
    const t3Res = await request("/api/auth/dev-login", {
      method: "POST",
      headers: { "x-qa-secret": "super-secret-qa-key" },
      body: { email: player1.email },
    });
    if (
      t3Res.status === 200 &&
      t3Res.data?.success &&
      t3Res.data?.token &&
      t3Res.data?.user?.role === "PLAYER"
    ) {
      console.log("  ✅ dev-login succeeded: 200 OK, token issued, user.role present");
    } else {
      throw new Error(`Test 3 failed: ${JSON.stringify(t3Res.data)}`);
    }

    // TEST 4: dev-login with secret + email not allowed -> 403
    console.log("\n▶ TEST 4: dev-login with secret + email not allowed -> 403");
    const t4Res = await request("/api/auth/dev-login", {
      method: "POST",
      headers: { "x-qa-secret": "super-secret-qa-key" },
      body: { email: "notallowed@chessone.local" },
    });
    if (t4Res.status === 403 && t4Res.data?.error?.code === "FORBIDDEN") {
      console.log("  ✅ dev-login rejected disallowed email with 403 FORBIDDEN");
    } else {
      throw new Error(`Test 4 failed: Expected 403 FORBIDDEN, got ${t4Res.status}`);
    }

    // TEST 5: GET /api/auth/me -> role present
    console.log("\n▶ TEST 5: GET /api/auth/me -> role present");
    const t5Res = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    if (
      t5Res.status === 200 &&
      t5Res.data?.data?.user?.role === "PLAYER" &&
      typeof t5Res.data?.data?.user?.id === "number"
    ) {
      console.log("  ✅ GET /api/auth/me returned user with role: PLAYER");
    } else {
      throw new Error(`Test 5 failed: ${JSON.stringify(t5Res.data)}`);
    }

    // TEST 6: change role in DB, same token, /me -> new role
    console.log("\n▶ TEST 6: change role in DB, same token, /me -> new role");
    await prisma.user.update({
      where: { id: player1.id },
      data: { role: "COACH" },
    });
    const t6Res = await request("/api/auth/me", {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    // Restore player1 role back to PLAYER
    await prisma.user.update({
      where: { id: player1.id },
      data: { role: "PLAYER" },
    });
    if (t6Res.status === 200 && t6Res.data?.data?.user?.role === "COACH") {
      console.log("  ✅ /me dynamically reflects DB role change with existing JWT");
    } else {
      throw new Error(`Test 6 failed: Expected role COACH, got: ${JSON.stringify(t6Res.data)}`);
    }

    // TEST 7: socket without token -> connect_error UNAUTHORIZED
    console.log("\n▶ TEST 7: socket without token -> connect_error UNAUTHORIZED");
    const sWithoutToken = ClientIO(`http://localhost:${TEST_PORT}`, {
      auth: {},
      reconnection: false,
    });
    const t7Promise = new Promise((resolve, reject) => {
      sWithoutToken.on("connect", () => {
        sWithoutToken.disconnect();
        reject(new Error("Socket without token should not connect"));
      });
      sWithoutToken.on("connect_error", (err) => {
        sWithoutToken.disconnect();
        if (err.message.includes("UNAUTHORIZED")) {
          console.log("  ✅ Socket without token rejected with UNAUTHORIZED");
          resolve();
        } else {
          reject(new Error(`Expected UNAUTHORIZED error, got: ${err.message}`));
        }
      });
    });
    await t7Promise;

    // TEST 8: socket with only auth.userId -> rejected
    console.log("\n▶ TEST 8: socket with only auth.userId -> rejected");
    const sWithUserIdOnly = ClientIO(`http://localhost:${TEST_PORT}`, {
      auth: { userId: player1.id },
      reconnection: false,
    });
    const t8Promise = new Promise((resolve, reject) => {
      sWithUserIdOnly.on("connect", () => {
        sWithUserIdOnly.disconnect();
        reject(new Error("Socket with only auth.userId should not connect"));
      });
      sWithUserIdOnly.on("connect_error", (err) => {
        sWithUserIdOnly.disconnect();
        if (err.message.includes("UNAUTHORIZED")) {
          console.log("  ✅ Socket with only auth.userId rejected with UNAUTHORIZED");
          resolve();
        } else {
          reject(new Error(`Expected UNAUTHORIZED error, got: ${err.message}`));
        }
      });
    });
    await t8Promise;

    // TEST 9: socket with valid token -> connects
    console.log("\n▶ TEST 9: socket with valid token -> connects");
    const sValid = ClientIO(`http://localhost:${TEST_PORT}`, {
      auth: { token: p1Token },
      reconnection: false,
    });
    const t9Promise = new Promise((resolve, reject) => {
      sValid.on("connect", () => {
        console.log("  ✅ Socket with valid JWT connected successfully");
        sValid.disconnect();
        resolve();
      });
      sValid.on("connect_error", (err) => {
        sValid.disconnect();
        reject(new Error(`Valid socket connection failed: ${err.message}`));
      });
    });
    await t9Promise;

    // TEST 10: requireRole("COACH") as PLAYER -> 403 COACH_ROLE_REQUIRED
    console.log("\n▶ TEST 10: requireRole('COACH') as PLAYER -> 403 COACH_ROLE_REQUIRED");
    const t10Res = await request("/test/require-coach", {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    if (t10Res.status === 403 && t10Res.data?.error?.code === "COACH_ROLE_REQUIRED") {
      console.log("  ✅ requireRole correctly rejected PLAYER with 403 COACH_ROLE_REQUIRED");
    } else {
      throw new Error(`Test 10 failed: Expected 403 COACH_ROLE_REQUIRED, got: ${t10Res.status}`);
    }

    // TEST 11: requireClassMember: non-member 403 / member pass / admin pass
    console.log("\n▶ TEST 11: requireClassMember: non-member 403 / member pass / admin pass");
    // Create test class
    const testJoinCode = "T" + generateCode(5);
    const testClass = await prisma.class.create({
      data: {
        name: "Phase 0 Test Class",
        joinCode: testJoinCode,
        ownerId: coach1.id,
      },
    });

    // Add player1 as student member
    await prisma.classMember.create({
      data: {
        classId: testClass.id,
        userId: player1.id,
        role: "STUDENT",
        status: "ACTIVE",
      },
    });

    // 11a: Non-member player2 -> 403 NOT_A_CLASS_MEMBER
    const t11NonMember = await request(`/test/classes/${testClass.id}/member-only`, {
      headers: { Authorization: `Bearer ${p2Token}` },
    });
    if (
      t11NonMember.status === 403 &&
      t11NonMember.data?.error?.code === "NOT_A_CLASS_MEMBER"
    ) {
      console.log("  ✅ Non-member rejected with 403 NOT_A_CLASS_MEMBER");
    } else {
      throw new Error(`Test 11a failed: Expected 403 NOT_A_CLASS_MEMBER, got ${t11NonMember.status}`);
    }

    // 11b: Member player1 -> 200 pass
    const t11Member = await request(`/test/classes/${testClass.id}/member-only`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    if (t11Member.status === 200 && t11Member.data?.success) {
      console.log("  ✅ Active class member successfully accessed member-only route");
    } else {
      throw new Error(`Test 11b failed: Expected 200, got ${t11Member.status}`);
    }

    // 11c: Admin user -> 200 pass
    const t11Admin = await request(`/test/classes/${testClass.id}/member-only`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (t11Admin.status === 200 && t11Admin.data?.success) {
      console.log("  ✅ ADMIN user passed member check automatically");
    } else {
      throw new Error(`Test 11c failed: Expected 200 for ADMIN, got ${t11Admin.status}`);
    }

    // TEST 12: requireClassCoach: student 403 / owner pass
    console.log("\n▶ TEST 12: requireClassCoach: student 403 / owner pass");
    // Add owner as ClassMember
    await prisma.classMember.create({
      data: {
        classId: testClass.id,
        userId: coach1.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // 12a: Student player1 -> 403 NOT_CLASS_COACH
    const t12Student = await request(`/test/classes/${testClass.id}/coach-only`, {
      headers: { Authorization: `Bearer ${p1Token}` },
    });
    if (
      t12Student.status === 403 &&
      t12Student.data?.error?.code === "NOT_CLASS_COACH"
    ) {
      console.log("  ✅ Student rejected with 403 NOT_CLASS_COACH");
    } else {
      throw new Error(`Test 12a failed: Expected 403 NOT_CLASS_COACH, got ${t12Student.status}`);
    }

    // 12b: Owner coach1 -> 200 pass
    const t12Owner = await request(`/test/classes/${testClass.id}/coach-only`, {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (t12Owner.status === 200 && t12Owner.data?.success) {
      console.log("  ✅ Class OWNER passed coach check successfully");
    } else {
      throw new Error(`Test 12b failed: Expected 200, got ${t12Owner.status}`);
    }

    // Clean up test class (cascades to members)
    await prisma.class.delete({ where: { id: testClass.id } });

    // TEST 13: generateUniqueJoinCode x 1000 -> valid format
    console.log("\n▶ TEST 13: generateUniqueJoinCode x 1000 -> valid format");
    const joinCodeRegex = /^[A-HJ-NP-Z2-9]{6}$/;
    let allValid = true;
    for (let i = 0; i < 1000; i++) {
      const code = generateCode(6);
      if (!joinCodeRegex.test(code)) {
        allValid = false;
        throw new Error(`Invalid join code generated: ${code}`);
      }
    }
    if (allValid) {
      console.log("  ✅ 1,000 join codes generated; 100% matched /^[A-HJ-NP-Z2-9]{6}$/");
    }

    // TEST 14: npm run test:auth passes
    console.log("\n▶ TEST 14: Verification that npm run test:auth passes");
    execSync("npm run test:auth", { stdio: "inherit" });
    console.log("  ✅ npm run test:auth passed!");

    // TEST 15: npm run test:game passes
    console.log("\n▶ TEST 15: Verification that npm run test:game passes");
    execSync("npm run test:game", { stdio: "inherit" });
    console.log("  ✅ npm run test:game passed!");

    console.log("\n==================================================");
    console.log("🎉 ALL 15 PHASE 0 TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================");
  } catch (err) {
    console.error("\n❌ PHASE 0 TEST SUITE FAILED:", err);
    process.exit(1);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();
  }
}

runPhase0Tests();
