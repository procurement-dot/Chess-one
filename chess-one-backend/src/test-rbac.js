const http = require("http");
const assert = require("assert");
const app = require("./app");
const prisma = require("./config/database");
const { requirePermission } = require("./middleware/rbac.middleware");

let server = null;
let passed = 0;
let failed = 0;

function check(rowNum, user, requestDesc, expected, passedCondition, detail = "") {
  if (passedCondition) {
    passed++;
    console.log(
      `| ${String(rowNum).padEnd(2)} | ${String(user).padEnd(10)} | ${String(requestDesc).padEnd(38)} | ${String(expected).padEnd(8)} | PASS   | ${detail}`
    );
  } else {
    failed++;
    console.error(
      `| ${String(rowNum).padEnd(2)} | ${String(user).padEnd(10)} | ${String(requestDesc).padEnd(38)} | ${String(expected).padEnd(8)} | FAIL   | ${detail}`
    );
  }
}

function isStandardForbidden(body) {
  return (
    body &&
    body.success === false &&
    body.error &&
    body.error.code === "FORBIDDEN" &&
    body.error.message === "You do not have permission to do this"
  );
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

async function runRbacTests() {
  console.log("==================================================");
  console.log("🛡️  ChessOne — RBAC Test Suite");
  console.log("==================================================");

  // Unit check at top of script
  let threwOnInvalid = false;
  try {
    requirePermission("NOT_A_REAL_PERMISSION");
  } catch (err) {
    threwOnInvalid = true;
  }
  assert(threwOnInvalid, "requirePermission('NOT_A_REAL_PERMISSION') must throw on startup");
  console.log("✔ Unit check passed: requirePermission('NOT_A_REAL_PERMISSION') threw as expected\n");

  let baseUrl = process.env.API_URL;
  if (!baseUrl) {
    // Check if port 4000 is active and responding with updated rbac-test routes
    try {
      const probe = await fetch("http://localhost:4000/api/rbac-test/whoami");
      if (probe.status === 401) {
        baseUrl = "http://localhost:4000";
      }
    } catch (_) {}
  }

  if (!baseUrl) {
    const targetPort = 4000;
    try {
      server = http.createServer(app);
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(targetPort, resolve);
      });
      baseUrl = `http://localhost:${targetPort}`;
      console.log(`[SETUP] Test server running on port ${targetPort}`);
    } catch (_) {
      const fallbackPort = 4995;
      server = http.createServer(app);
      await new Promise((resolve) => server.listen(fallbackPort, resolve));
      baseUrl = `http://localhost:${fallbackPort}`;
      console.log(`[SETUP] Test server running on port ${fallbackPort}`);
    }
  } else {
    console.log(`[SETUP] Using existing server at ${baseUrl}`);
  }

  try {
    // Ensure test users are seeded in DB
    console.log("[SETUP] Authenticating test users via dev-login...");
    const student1 = await devLogin(baseUrl, "student1@chessone.local");
    const parent = await devLogin(baseUrl, "parent@chessone.local");
    const organiser = await devLogin(baseUrl, "organiser@chessone.local");
    const organiser2 = await devLogin(baseUrl, "organiser2@chessone.local");
    const admin = await devLogin(baseUrl, "admin@chessone.local");

    // Ensure initial roles match expected roles in DB
    await prisma.user.update({ where: { id: organiser.user.id }, data: { role: "ORGANISER" } });
    await prisma.user.update({ where: { id: student1.user.id }, data: { role: "STUDENT" } });
    await prisma.user.update({ where: { id: parent.user.id }, data: { role: "PARENT" } });
    await prisma.user.update({ where: { id: admin.user.id }, data: { role: "ADMIN" } });
    await prisma.user.update({ where: { id: organiser2.user.id }, data: { role: "ORGANISER" } });

    console.log("\n---------------------------------------------------------------------------------------------------------");
    console.log("| #  | User       | Request                                | Expected | Result | Details                 |");
    console.log("---------------------------------------------------------------------------------------------------------");

    // 1: no token | GET /api/rbac-test/organiser | 401
    const res1 = await makeRequest(baseUrl, "/api/rbac-test/organiser");
    check(
      1,
      "no token",
      "GET /api/rbac-test/organiser",
      "401",
      res1.status === 401 && res1.data?.error?.code === "UNAUTHORIZED",
      `status=${res1.status}, code=${res1.data?.error?.code}`
    );

    // 2: student1 | GET /api/rbac-test/whoami | 200, role STUDENT
    const res2 = await makeRequest(baseUrl, "/api/rbac-test/whoami", { headers: student1.authHeader });
    check(
      2,
      "student1",
      "GET /api/rbac-test/whoami",
      "200",
      res2.status === 200 && res2.data?.user?.role === "STUDENT",
      `status=${res2.status}, role=${res2.data?.user?.role}`
    );

    // 3: student1 | GET /api/rbac-test/organiser | 403 FORBIDDEN
    const res3 = await makeRequest(baseUrl, "/api/rbac-test/organiser", { headers: student1.authHeader });
    check(
      3,
      "student1",
      "GET /api/rbac-test/organiser",
      "403",
      res3.status === 403 && isStandardForbidden(res3.data),
      `status=${res3.status}, code=${res3.data?.error?.code}`
    );

    // 4: parent | GET /api/rbac-test/organiser | 403
    const res4 = await makeRequest(baseUrl, "/api/rbac-test/organiser", { headers: parent.authHeader });
    check(
      4,
      "parent",
      "GET /api/rbac-test/organiser",
      "403",
      res4.status === 403 && isStandardForbidden(res4.data),
      `status=${res4.status}, code=${res4.data?.error?.code}`
    );

    // 5: organiser | GET /api/rbac-test/organiser | 200
    const res5 = await makeRequest(baseUrl, "/api/rbac-test/organiser", { headers: organiser.authHeader });
    check(
      5,
      "organiser",
      "GET /api/rbac-test/organiser",
      "200",
      res5.status === 200 && res5.data?.ok === true,
      `status=${res5.status}, ok=${res5.data?.ok}`
    );

    // 6: admin | GET /api/rbac-test/organiser | 200 (admin passes all)
    const res6 = await makeRequest(baseUrl, "/api/rbac-test/organiser", { headers: admin.authHeader });
    check(
      6,
      "admin",
      "GET /api/rbac-test/organiser",
      "200",
      res6.status === 200 && res6.data?.ok === true,
      `status=${res6.status}, ok=${res6.data?.ok}`
    );

    // 7: organiser | GET /api/rbac-test/student | 403
    const res7 = await makeRequest(baseUrl, "/api/rbac-test/student", { headers: organiser.authHeader });
    check(
      7,
      "organiser",
      "GET /api/rbac-test/student",
      "403",
      res7.status === 403 && isStandardForbidden(res7.data),
      `status=${res7.status}, code=${res7.data?.error?.code}`
    );

    // 8: student1 | GET /api/rbac-test/student | 200
    const res8 = await makeRequest(baseUrl, "/api/rbac-test/student", { headers: student1.authHeader });
    check(
      8,
      "student1",
      "GET /api/rbac-test/student",
      "200",
      res8.status === 200 && res8.data?.ok === true,
      `status=${res8.status}, ok=${res8.data?.ok}`
    );

    // 9: organiser | GET /api/rbac-test/owner/{organiser.id} | 200
    const res9 = await makeRequest(baseUrl, `/api/rbac-test/owner/${organiser.user.id}`, { headers: organiser.authHeader });
    check(
      9,
      "organiser",
      `GET /api/rbac-test/owner/${organiser.user.id}`,
      "200",
      res9.status === 200 && res9.data?.ok === true,
      `status=${res9.status}, ok=${res9.data?.ok}`
    );

    // 10: organiser2 | GET /api/rbac-test/owner/{organiser.id} | 403
    const res10 = await makeRequest(baseUrl, `/api/rbac-test/owner/${organiser.user.id}`, { headers: organiser2.authHeader });
    check(
      10,
      "organiser2",
      `GET /api/rbac-test/owner/${organiser.user.id}`,
      "403",
      res10.status === 403 && isStandardForbidden(res10.data),
      `status=${res10.status}, code=${res10.data?.error?.code}`
    );

    // 11: admin | GET /api/rbac-test/owner/{organiser.id} | 200
    const res11 = await makeRequest(baseUrl, `/api/rbac-test/owner/${organiser.user.id}`, { headers: admin.authHeader });
    check(
      11,
      "admin",
      `GET /api/rbac-test/owner/${organiser.user.id}`,
      "200",
      res11.status === 200 && res11.data?.ok === true,
      `status=${res11.status}, ok=${res11.data?.ok}`
    );

    // 12: organiser | change role to STUDENT in DB, then GET /api/rbac-test/organiser | 403
    await prisma.user.update({
      where: { id: organiser.user.id },
      data: { role: "STUDENT" },
    });
    const res12 = await makeRequest(baseUrl, "/api/rbac-test/organiser", { headers: organiser.authHeader });
    // Reset back to ORGANISER immediately
    await prisma.user.update({
      where: { id: organiser.user.id },
      data: { role: "ORGANISER" },
    });
    check(
      12,
      "organiser",
      "GET /api/rbac-test/organiser (as STUDENT)",
      "403",
      res12.status === 403 && isStandardForbidden(res12.data),
      `status=${res12.status}, code=${res12.data?.error?.code}`
    );

    console.log("---------------------------------------------------------------------------------------------------------\n");

    // Bonus check: NODE_ENV=production returns 404 for /api/rbac-test/*
    console.log("▶ Bonus Check: NODE_ENV=production blocks /api/rbac-test routes (returns 404)");
    const savedEnv = process.env.NODE_ENV;
    let prodServer;
    try {
      process.env.NODE_ENV = "production";
      delete require.cache[require.resolve("./app")];
      const prodApp = require("./app");
      prodServer = http.createServer(prodApp);
      const prodPort = 4993;
      await new Promise((resolve) => prodServer.listen(prodPort, resolve));
      const prodRes = await makeRequest(`http://localhost:${prodPort}`, "/api/rbac-test/whoami");
      if (prodRes.status === 404) {
        passed++;
        console.log(`  PASS: /api/rbac-test/* returns 404 when NODE_ENV=production — status=${prodRes.status}\n`);
      } else {
        failed++;
        console.error(`  FAIL: Expected 404 under NODE_ENV=production, got status=${prodRes.status}\n`);
      }
    } finally {
      if (prodServer) {
        await new Promise((resolve) => prodServer.close(resolve));
      }
      process.env.NODE_ENV = savedEnv;
      delete require.cache[require.resolve("./app")];
    }

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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await prisma.$disconnect();
  }
}

runRbacTests();
