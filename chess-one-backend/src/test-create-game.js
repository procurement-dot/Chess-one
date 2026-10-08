const prisma = require("./config/prisma");

async function createTestGame() {
  try {
    // Create test player 1
    const player1 = await prisma.user.create({
      data: {
        username: "player1",
        email: "player1@chessone.local",
      },
    });

    // Create test player 2
    const player2 = await prisma.user.create({
      data: {
        username: "player2",
        email: "player2@chessone.local",
      },
    });

    // Create game
    const game = await prisma.game.create({
      data: {
        status: "ACTIVE",

        fen: "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1",

        pgn: "",

        timeControl: "10+0",

        whiteTimeMs: 600000,
        blackTimeMs: 600000,

        currentTurn: "WHITE",

        startedAt: new Date(),

        players: {
          create: [
            {
              userId: player1.id,
              color: "WHITE",
            },
            {
              userId: player2.id,
              color: "BLACK",
            },
          ],
        },
      },

      include: {
        players: true,
      },
    });

    console.log("✅ Game created successfully");
    console.log(game);
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestGame();
