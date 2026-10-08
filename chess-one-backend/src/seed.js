require("dotenv").config();
const prisma = require("./config/prisma");

async function seed() {
  try {
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

    const player3 = await prisma.user.upsert({
      where: { email: "player3@chessone.local" },
      update: { name: "Player Three" },
      create: { name: "Player Three", email: "player3@chessone.local" },
    });

    console.log("✅ Seeded test users:");
    console.log({ player1, player2, player3 });
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
