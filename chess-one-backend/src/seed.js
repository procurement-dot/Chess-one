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

    // Seed Beginners Batch A
    let batchA = await prisma.class.findFirst({
      where: { name: "Beginners Batch A", ownerId: coach1.id },
    });

    if (!batchA) {
      batchA = await prisma.class.create({
        data: {
          name: "Beginners Batch A",
          description: "Foundational chess batch for young champions",
          level: "Beginner",
          joinCode: "BATCHA",
          ownerId: coach1.id,
          maxStudents: 30,
          timezone: "Asia/Kolkata",
          status: "ACTIVE",
        },
      });
    }

    // Coach1 as OWNER
    await prisma.classMember.upsert({
      where: {
        classId_userId: {
          classId: batchA.id,
          userId: coach1.id,
        },
      },
      update: { role: "OWNER", status: "ACTIVE" },
      create: {
        classId: batchA.id,
        userId: coach1.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    // Students player1, player2, player3
    for (const player of [player1, player2, player3]) {
      await prisma.classMember.upsert({
        where: {
          classId_userId: {
            classId: batchA.id,
            userId: player.id,
          },
        },
        update: { role: "STUDENT", status: "ACTIVE" },
        create: {
          classId: batchA.id,
          userId: player.id,
          role: "STUDENT",
          status: "ACTIVE",
        },
      });
    }

    console.log("✅ Seeded class 'Beginners Batch A' with students successfully:");
    console.log({ classId: batchA.id, joinCode: batchA.joinCode });
  } catch (error) {
    console.error("❌ Seed error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
