require("dotenv").config();
const prisma = require("./config/prisma");

async function seed() {
  try {
    const admin = await prisma.user.upsert({
      where: { email: "admin@chessone.local" },
      update: { name: "Admin User", role: "ADMIN" },
      create: { name: "Admin User", email: "admin@chessone.local", role: "ADMIN" },
    });

    const coach1 = await prisma.user.upsert({
      where: { email: "coach1@chessone.local" },
      update: { name: "Coach One", role: "COACH" },
      create: { name: "Coach One", email: "coach1@chessone.local", role: "COACH" },
    });

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

    const player3 = await prisma.user.upsert({
      where: { email: "player3@chessone.local" },
      update: { name: "Player Three", role: "PLAYER" },
      create: { name: "Player Three", email: "player3@chessone.local", role: "PLAYER" },
    });

    console.log("✅ Seeded users successfully:");
    console.log({ admin, coach1, player1, player2, player3 });
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
