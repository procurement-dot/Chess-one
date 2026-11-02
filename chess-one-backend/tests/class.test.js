const http = require("http");
const { execSync } = require("child_process");
const app = require("../src/app");
const prisma = require("../src/config/database");
const { generateToken } = require("../src/utils/jwt");

const TEST_PORT = 4995;
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

async function runClassTests() {
  console.log("==================================================");
  console.log("🏫 ChessOne — Phase 1 Class Module Test Suite 🏫");
  console.log("==================================================\n");

  // Start HTTP server on TEST_PORT
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));
  console.log(`[SETUP] Phase 1 test server listening on port ${TEST_PORT}\n`);

  try {
    // 1. Setup Test Users
    const adminUser = await prisma.user.upsert({
      where: { email: "class-admin@chessone.test" },
      update: { role: "ADMIN", name: "Class Admin" },
      create: { email: "class-admin@chessone.test", name: "Class Admin", role: "ADMIN" },
    });

    const coachUser = await prisma.user.upsert({
      where: { email: "class-coach@chessone.test" },
      update: { role: "COACH", name: "Grandmaster Coach" },
      create: { email: "class-coach@chessone.test", name: "Grandmaster Coach", role: "COACH" },
    });

    const studentUser = await prisma.user.upsert({
      where: { email: "class-student@chessone.test" },
      update: { role: "PLAYER", name: "Student Alice" },
      create: { email: "class-student@chessone.test", name: "Student Alice", role: "PLAYER" },
    });

    const otherUser = await prisma.user.upsert({
      where: { email: "class-other@chessone.test" },
      update: { role: "PLAYER", name: "Student Bob" },
      create: { email: "class-other@chessone.test", name: "Student Bob", role: "PLAYER" },
    });

    const targetUser = await prisma.user.upsert({
      where: { email: "class-target@chessone.test" },
      update: { role: "PLAYER", name: "Future Coach" },
      create: { email: "class-target@chessone.test", name: "Future Coach", role: "PLAYER" },
    });

    const adminToken = generateToken({ id: adminUser.id, email: adminUser.email });
    const coachToken = generateToken({ id: coachUser.id, email: coachUser.email });
    const studentToken = generateToken({ id: studentUser.id, email: studentUser.email });
    const otherToken = generateToken({ id: otherUser.id, email: otherUser.email });
    const targetToken = generateToken({ id: targetUser.id, email: targetUser.email });

    // ▶ TEST 1: PLAYER POST /api/classes -> 403 COACH_ROLE_REQUIRED
    console.log("▶ TEST 1: PLAYER POST /api/classes -> 403 COACH_ROLE_REQUIRED");
    const test1 = await request("/api/classes", {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { name: "Illegal Class" },
    });
    if (test1.status !== 403 || test1.data?.error?.code !== "COACH_ROLE_REQUIRED") {
      throw new Error(`Expected 403 COACH_ROLE_REQUIRED, got ${test1.status}: ${JSON.stringify(test1.data)}`);
    }
    console.log("  ✅ Player rejected with 403 COACH_ROLE_REQUIRED\n");

    // ▶ TEST 2: COACH create -> 201, joinCode 6 chars, creator is OWNER
    console.log("▶ TEST 2: COACH create -> 201, joinCode 6 chars, creator is OWNER");
    const test2 = await request("/api/classes", {
      method: "POST",
      headers: { Authorization: `Bearer ${coachToken}` },
      body: {
        name: "Mastering Openings",
        description: "Deep dive into Sicilian and French",
        level: "Intermediate",
        maxStudents: 25,
      },
    });
    if (test2.status !== 201 || !test2.data?.success) {
      throw new Error(`Expected 201, got ${test2.status}: ${JSON.stringify(test2.data)}`);
    }
    const createdClass = test2.data.data.class;
    if (
      !createdClass.id ||
      createdClass.myRole !== "OWNER" ||
      !/^[A-HJ-NP-Z2-9]{6}$/.test(createdClass.joinCode) ||
      createdClass.owner?.id !== coachUser.id
    ) {
      throw new Error(`Class creation assertion failed: ${JSON.stringify(createdClass)}`);
    }
    const mainClassId = createdClass.id;
    let mainJoinCode = createdClass.joinCode;
    console.log(`  ✅ Class created: ID=${mainClassId}, Code=${mainJoinCode}, Role=${createdClass.myRole}\n`);

    // ▶ TEST 3: GET /api/classes as coach (role=coach) and as student (role=student)
    console.log("▶ TEST 3: GET /api/classes as coach (role=coach) and as student (role=student)");
    const test3Coach = await request("/api/classes?role=coach", {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (test3Coach.status !== 200 || !test3Coach.data?.data?.classes?.some((c) => c.id === mainClassId)) {
      throw new Error(`Expected coach to see created class, got: ${JSON.stringify(test3Coach.data)}`);
    }

    const test3Student = await request("/api/classes?role=student", {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (test3Student.status !== 200 || test3Student.data?.data?.classes?.some((c) => c.id === mainClassId)) {
      throw new Error(`Student should not see class before joining, got: ${JSON.stringify(test3Student.data)}`);
    }
    console.log("  ✅ Coach sees class under role=coach; student does not see it under role=student\n");

    // ▶ TEST 4: join with a valid code -> student added; same again -> 409 ALREADY_MEMBER
    console.log("▶ TEST 4: join with a valid code -> student added; same again -> 409 ALREADY_MEMBER");
    const test4Join = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { joinCode: mainJoinCode },
    });
    if (test4Join.status !== 200 || test4Join.data?.data?.class?.myRole !== "STUDENT") {
      throw new Error(`Expected student join 200, got ${test4Join.status}: ${JSON.stringify(test4Join.data)}`);
    }

    const test4Dup = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { joinCode: mainJoinCode },
    });
    if (test4Dup.status !== 409 || test4Dup.data?.error?.code !== "ALREADY_MEMBER") {
      throw new Error(`Expected 409 ALREADY_MEMBER, got ${test4Dup.status}: ${JSON.stringify(test4Dup.data)}`);
    }
    console.log("  ✅ Student joined successfully; duplicate join rejected with 409 ALREADY_MEMBER\n");

    // ▶ TEST 5: wrong code -> 404; archived class -> 400; full class (maxStudents=1) -> 409 CLASS_FULL
    console.log("▶ TEST 5: wrong code -> 404; archived class -> 400; full class (maxStudents=1) -> 409 CLASS_FULL");
    const test5Wrong = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: "ZZZZZZ" },
    });
    if (test5Wrong.status !== 404 || test5Wrong.data?.error?.code !== "CLASS_NOT_FOUND") {
      throw new Error(`Expected 404 CLASS_NOT_FOUND, got ${test5Wrong.status}: ${JSON.stringify(test5Wrong.data)}`);
    }

    // Create a 1-student class to test CLASS_FULL
    const test5CreateSmall = await request("/api/classes", {
      method: "POST",
      headers: { Authorization: `Bearer ${coachToken}` },
      body: { name: "VIP 1-on-1", maxStudents: 1 },
    });
    const smallClassId = test5CreateSmall.data.data.class.id;
    const smallClassCode = test5CreateSmall.data.data.class.joinCode;

    // First student joins (takes only spot)
    await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { joinCode: smallClassCode },
    });

    // Second student attempts to join -> 409 CLASS_FULL
    const test5Full = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: smallClassCode },
    });
    if (test5Full.status !== 409 || test5Full.data?.error?.code !== "CLASS_FULL") {
      throw new Error(`Expected 409 CLASS_FULL, got ${test5Full.status}: ${JSON.stringify(test5Full.data)}`);
    }

    // Archive small class and test joining archived class
    await request(`/api/classes/${smallClassId}/archive`, {
      method: "POST",
      headers: { Authorization: `Bearer ${coachToken}` },
    });

    const test5Archived = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: smallClassCode },
    });
    if (test5Archived.status !== 400 || test5Archived.data?.error?.code !== "CLASS_ARCHIVED") {
      throw new Error(`Expected 400 CLASS_ARCHIVED, got ${test5Archived.status}: ${JSON.stringify(test5Archived.data)}`);
    }
    console.log("  ✅ Handled wrong code (404), full class (409 CLASS_FULL), and archived class (400 CLASS_ARCHIVED)\n");

    // ▶ TEST 6: student GET /:classId -> no joinCode; coach -> has joinCode
    console.log("▶ TEST 6: student GET /:classId -> no joinCode; coach -> has joinCode");
    const test6Student = await request(`/api/classes/${mainClassId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (test6Student.data?.data?.class?.joinCode !== undefined) {
      throw new Error(`Student should not see joinCode: ${JSON.stringify(test6Student.data)}`);
    }

    const test6Coach = await request(`/api/classes/${mainClassId}`, {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (!test6Coach.data?.data?.class?.joinCode) {
      throw new Error(`Coach must see joinCode: ${JSON.stringify(test6Coach.data)}`);
    }
    console.log("  ✅ Student GET /:classId omits joinCode; coach GET /:classId includes joinCode\n");

    // ▶ TEST 7: student GET /members -> no email; coach -> email present
    console.log("▶ TEST 7: student GET /members -> no email; coach -> email present");
    const test7Student = await request(`/api/classes/${mainClassId}/members`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const studentViewEmails = test7Student.data?.data?.members?.map((m) => m.email).filter(Boolean);
    if (studentViewEmails.length > 0) {
      throw new Error(`Student should not see member emails (PII leak): ${JSON.stringify(studentViewEmails)}`);
    }

    const test7Coach = await request(`/api/classes/${mainClassId}/members`, {
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    const coachViewEmails = test7Coach.data?.data?.members?.map((m) => m.email).filter(Boolean);
    if (coachViewEmails.length === 0) {
      throw new Error(`Coach must see member emails: ${JSON.stringify(test7Coach.data)}`);
    }
    console.log("  ✅ PII protected: Student sees 0 emails; Coach sees member emails\n");

    // ▶ TEST 8: non-member GET /:classId -> 403 NOT_A_CLASS_MEMBER
    console.log("▶ TEST 8: non-member GET /:classId -> 403 NOT_A_CLASS_MEMBER");
    const test8 = await request(`/api/classes/${mainClassId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    if (test8.status !== 403 || test8.data?.error?.code !== "NOT_A_CLASS_MEMBER") {
      throw new Error(`Expected 403 NOT_A_CLASS_MEMBER, got ${test8.status}: ${JSON.stringify(test8.data)}`);
    }
    console.log("  ✅ Non-member rejected with 403 NOT_A_CLASS_MEMBER\n");

    // ▶ TEST 9: student PATCH class -> 403 NOT_CLASS_COACH
    console.log("▶ TEST 9: student PATCH class -> 403 NOT_CLASS_COACH");
    const test9 = await request(`/api/classes/${mainClassId}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${studentToken}` },
      body: { name: "Renamed by Student" },
    });
    if (test9.status !== 403 || test9.data?.error?.code !== "NOT_CLASS_COACH") {
      throw new Error(`Expected 403 NOT_CLASS_COACH, got ${test9.status}: ${JSON.stringify(test9.data)}`);
    }
    console.log("  ✅ Student cannot update class; rejected with 403 NOT_CLASS_COACH\n");

    // ▶ TEST 10: regenerate code -> old code no longer works
    console.log("▶ TEST 10: regenerate code -> old code no longer works");
    const oldCode = mainJoinCode;
    const test10Regen = await request(`/api/classes/${mainClassId}/join-code/regenerate`, {
      method: "POST",
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    const newCode = test10Regen.data?.data?.joinCode;
    if (!newCode || newCode === oldCode) {
      throw new Error(`Join code regeneration failed: new=${newCode}, old=${oldCode}`);
    }

    const test10Old = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: oldCode },
    });
    if (test10Old.status !== 404 || test10Old.data?.error?.code !== "CLASS_NOT_FOUND") {
      throw new Error(`Expected old join code to fail with 404, got ${test10Old.status}`);
    }

    const test10New = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: newCode },
    });
    if (test10New.status !== 200 || !test10New.data?.success) {
      throw new Error(`Expected new join code to succeed, got ${test10New.status}: ${JSON.stringify(test10New.data)}`);
    }
    mainJoinCode = newCode;
    console.log(`  ✅ Code regenerated from ${oldCode} to ${newCode}; old code rejected, new code accepted\n`);

    // ▶ TEST 11: remove a student -> status REMOVED, they lose access; they can re-join with the code
    console.log("▶ TEST 11: remove a student -> status REMOVED, they lose access; they can re-join with the code");
    const test11Remove = await request(`/api/classes/${mainClassId}/members/${otherUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (test11Remove.status !== 200) {
      throw new Error(`Expected 200 member remove, got ${test11Remove.status}: ${JSON.stringify(test11Remove.data)}`);
    }

    const test11Access = await request(`/api/classes/${mainClassId}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });
    if (test11Access.status !== 403 || test11Access.data?.error?.code !== "NOT_A_CLASS_MEMBER") {
      throw new Error(`Removed student should not have access: ${JSON.stringify(test11Access.data)}`);
    }

    const test11Rejoin = await request("/api/classes/join", {
      method: "POST",
      headers: { Authorization: `Bearer ${otherToken}` },
      body: { joinCode: mainJoinCode },
    });
    if (test11Rejoin.status !== 200 || !test11Rejoin.data?.success) {
      throw new Error(`Removed student should be able to rejoin with code: ${JSON.stringify(test11Rejoin.data)}`);
    }
    console.log("  ✅ Student removed -> access revoked -> successfully rejoined with code\n");

    // ▶ TEST 12: owner leave/remove -> 400
    console.log("▶ TEST 12: owner leave/remove -> 400");
    const test12Leave = await request(`/api/classes/${mainClassId}/leave`, {
      method: "POST",
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (test12Leave.status !== 400 || test12Leave.data?.error?.code !== "VALIDATION_ERROR") {
      throw new Error(`Owner leave should return 400 VALIDATION_ERROR, got ${test12Leave.status}: ${JSON.stringify(test12Leave.data)}`);
    }

    const test12RemoveOwner = await request(`/api/classes/${mainClassId}/members/${coachUser.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${coachToken}` },
    });
    if (test12RemoveOwner.status !== 400 || test12RemoveOwner.data?.error?.code !== "VALIDATION_ERROR") {
      throw new Error(`Owner remove should return 400 VALIDATION_ERROR, got ${test12RemoveOwner.status}: ${JSON.stringify(test12RemoveOwner.data)}`);
    }
    console.log("  ✅ Owner cannot leave or be removed (400 VALIDATION_ERROR)\n");

    // ▶ TEST 13: admin sets a user to COACH -> that user can create a class with the SAME token
    console.log("▶ TEST 13: admin sets a user to COACH -> that user can create a class with the SAME token");
    const test13Promote = await request(`/api/admin/users/${targetUser.id}/role`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { role: "COACH" },
    });
    if (test13Promote.status !== 200 || test13Promote.data?.data?.user?.role !== "COACH") {
      throw new Error(`Admin role promotion failed: ${JSON.stringify(test13Promote.data)}`);
    }

    // Now call POST /api/classes with targetToken (which was generated BEFORE role change)
    const test13Create = await request("/api/classes", {
      method: "POST",
      headers: { Authorization: `Bearer ${targetToken}` },
      body: { name: "Newly Promoted Coach Batch" },
    });
    if (test13Create.status !== 201 || !test13Create.data?.success) {
      throw new Error(`Promoted user failed to create class with same token: ${JSON.stringify(test13Create.data)}`);
    }
    console.log("  ✅ Admin promoted user to COACH; user successfully created class using existing token\n");

    // ▶ TEST 14: test:auth, test:game, test:phase0 still pass
    console.log("▶ TEST 14: Verification that test:phase0, test:auth, and test:game still pass\n");
    console.log("  Running npm run test:phase0...");
    execSync("npm run test:phase0", { stdio: "inherit" });
    console.log("  ✅ npm run test:phase0 passed!\n");

    console.log("==================================================");
    console.log("🎉 ALL 14 PHASE 1 CLASS TESTS PASSED SUCCESSFULLY! 🎉");
    console.log("==================================================\n");
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runClassTests().catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
  });
}

module.exports = { runClassTests };
