const prisma = require("../config/database");

async function main() {
  console.log("Checking DB connection and syncing sequences...");
  try {
    // 1. Sync User and Game primary key sequences
    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"User"','id'), (SELECT COALESCE(MAX(id), 1) FROM "User"));`
    );
    console.log("✓ User ID sequence synchronized.");

    await prisma.$executeRawUnsafe(
      `SELECT setval(pg_get_serial_sequence('"Game"','id'), (SELECT COALESCE(MAX(id), 1) FROM "Game"));`
    );
    console.log("✓ Game ID sequence synchronized.");

    // 2. Query any remaining @chessone.local users
    const testUsers = await prisma.user.findMany({
      where: {
        email: { endsWith: "@chessone.local" },
      },
      select: { id: true, name: true, email: true, createdAt: true },
    });

    console.log(`\nFound ${testUsers.length} test user(s) with @chessone.local:`);
    for (const u of testUsers) {
      console.log(` - ID: ${u.id}, Name: "${u.name}", Email: "${u.email}"`);
    }

    if (testUsers.length > 0) {
      console.log("\nSQL to delete these test users (DO NOT run without explicit user confirmation):");
      console.log(`DELETE FROM "Game" WHERE "whitePlayerId" IN (${testUsers.map((u) => u.id).join(", ")}) OR "blackPlayerId" IN (${testUsers.map((u) => u.id).join(", ")}) OR "createdBy" IN (${testUsers.map((u) => u.id).join(", ")});`);
      console.log(`DELETE FROM "GameInvitation" WHERE "senderId" IN (${testUsers.map((u) => u.id).join(", ")}) OR "receiverId" IN (${testUsers.map((u) => u.id).join(", ")});`);
      console.log(`DELETE FROM "User" WHERE email LIKE '%@chessone.local';`);
    } else {
      console.log("\nNo @chessone.local users found in database.");
    }
  } catch (err) {
    console.error("Database connection / sequence sync error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
