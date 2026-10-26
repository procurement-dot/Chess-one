const prisma = require("../config/database");
const { AppError } = require("../middleware/error.middleware");
const { STARTING_FEN } = require("../utils/chess");
const { parseTimeControl } = require("./clock.service");
const { generateGameCode } = require("../utils/game-code");
const {
  roundRobinRoundCount,
  roundRobinPairings,
} = require("./tournament-pairing.service");
const { emitToTournament, emitToUser } = require("../config/socket");

class TournamentRoundService {
  /**
   * Start a tournament (organizer action)
   */
  async startTournament(tournamentId, actingUser) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          where: { withdrawn: false },
          include: {
            user: {
              select: { id: true, name: true, rating: true },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status !== "UPCOMING") {
      if (tournament.status === "CANCELLED") {
        throw new AppError("TOURNAMENT_NOT_OPEN", "Cancelled tournament cannot be started", 409);
      }
      throw new AppError("TOURNAMENT_ALREADY_STARTED", "Tournament has already started", 409);
    }

    const players = tournament.players;
    if (players.length < 2) {
      throw new AppError("NOT_ENOUGH_PLAYERS", "At least 2 players are required to start a tournament", 409);
    }

    const totalRounds = roundRobinRoundCount(players.length);

    // Sort players by rating descending, then joinedAt ascending
    const sortedPlayers = [...players].sort((a, b) => {
      const ratingDiff = (b.user?.rating || 0) - (a.user?.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
    });

    let roundResult;

    // Run claim, seed updates, and Round 1 creation atomically in one transaction
    await prisma.$transaction(async (tx) => {
      // 1. Race-safely claim the tournament
      const claim = await tx.tournament.updateMany({
        where: { id: tournamentId, status: "UPCOMING" },
        data: {
          status: "ACTIVE",
          currentRound: 1,
          totalRounds,
        },
      });

      if (claim.count === 0) {
        throw new AppError("TOURNAMENT_ALREADY_STARTED", "Tournament has already started", 409);
      }

      // 2. Assign seeds 1..n
      for (let i = 0; i < sortedPlayers.length; i++) {
        await tx.tournamentPlayer.update({
          where: { id: sortedPlayers[i].id },
          data: { seed: i + 1 },
        });
      }

      // 3. Create Round 1
      const seededIds = sortedPlayers.map((p) => p.userId);
      roundResult = await this._createRoundTx(tx, tournament, 1, seededIds);
    });

    // 4. Emit socket events after successful transaction commit
    emitToTournament(tournamentId, "tournament:updated", {
      tournamentId,
      reason: "STARTED",
    });

    emitToTournament(tournamentId, "tournament:round-started", {
      tournamentId,
      roundNumber: 1,
      pairings: roundResult.pairings,
    });

    for (const p of roundResult.pairings) {
      if (p.black) {
        // Real game board
        emitToUser(p.white.id, "tournament:your-game", {
          tournamentId,
          tournamentName: tournament.name,
          roundNumber: 1,
          boardNumber: p.boardNumber,
          gameId: p.gameId,
          color: "WHITE",
          opponent: p.black,
        });

        emitToUser(p.black.id, "tournament:your-game", {
          tournamentId,
          tournamentName: tournament.name,
          roundNumber: 1,
          boardNumber: p.boardNumber,
          gameId: p.gameId,
          color: "BLACK",
          opponent: p.white,
        });
      } else {
        // Bye
        emitToUser(p.white.id, "tournament:your-game", {
          tournamentId,
          roundNumber: 1,
          bye: true,
        });
      }
    }

    const tournamentService = require("./tournament.service");
    return tournamentService.getTournament(actingUser, tournamentId);
  }

  /**
   * Internal helper to create a round inside a transaction
   */
  async _createRoundTx(tx, tournament, roundNumber, seededIds) {
    let round;
    try {
      round = await tx.tournamentRound.create({
        data: {
          tournamentId: tournament.id,
          roundNumber,
          status: "ACTIVE",
          startedAt: new Date(),
        },
      });
    } catch (err) {
      if (err.code === "P2002") {
        throw new AppError("ROUND_ALREADY_STARTED", `Round ${roundNumber} has already started`, 409);
      }
      throw err;
    }

    const pairings = roundRobinPairings(seededIds, roundNumber);
    const { initialTimeMs } = parseTimeControl(tournament.timeControl);
    const formattedPairings = [];

    // Map user info for output
    const users = await tx.user.findMany({
      where: { id: { in: seededIds } },
      select: { id: true, name: true, rating: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    for (const pairing of pairings) {
      if (pairing.blackId !== null) {
        // Real game board: generate unique gameCode and create Game
        let gameCode = generateGameCode();
        while (await tx.game.findUnique({ where: { gameCode } })) {
          gameCode = generateGameCode();
        }

        const now = new Date();
        const game = await tx.game.create({
          data: {
            gameCode,
            gameType: "PLAYER_VS_PLAYER",
            status: "ACTIVE",
            createdBy: tournament.createdBy,
            whitePlayerId: pairing.whiteId,
            blackPlayerId: pairing.blackId,
            timeControl: tournament.timeControl,
            whiteTimeMs: initialTimeMs,
            blackTimeMs: initialTimeMs,
            fen: STARTING_FEN,
            pgn: "",
            currentTurn: "WHITE",
            startedAt: now,
            tournamentId: tournament.id,
          },
        });

        const createdPairing = await tx.tournamentPairing.create({
          data: {
            roundId: round.id,
            boardNumber: pairing.boardNumber,
            whiteId: pairing.whiteId,
            blackId: pairing.blackId,
            gameId: game.id,
          },
        });

        formattedPairings.push({
          id: createdPairing.id,
          boardNumber: pairing.boardNumber,
          white: userMap.get(pairing.whiteId),
          black: userMap.get(pairing.blackId),
          gameId: game.id,
          gameStatus: "ACTIVE",
          result: null,
        });
      } else {
        // Bye board
        const createdPairing = await tx.tournamentPairing.create({
          data: {
            roundId: round.id,
            boardNumber: pairing.boardNumber,
            whiteId: pairing.whiteId,
            blackId: null,
            gameId: null,
            result: "BYE",
          },
        });

        await tx.tournamentPlayer.update({
          where: {
            tournamentId_userId: {
              tournamentId: tournament.id,
              userId: pairing.whiteId,
            },
          },
          data: {
            score: { increment: 1 },
            hadBye: true,
          },
        });

        formattedPairings.push({
          id: createdPairing.id,
          boardNumber: pairing.boardNumber,
          white: userMap.get(pairing.whiteId),
          black: null,
          gameId: null,
          gameStatus: null,
          result: "BYE",
        });
      }
    }

    return {
      roundNumber,
      status: round.status,
      pairings: formattedPairings,
    };
  }

  /**
   * Start a round standalone (e.g. for Phase 3 round transitions)
   */
  async startRound(tournamentId, roundNumber) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        players: {
          where: { withdrawn: false },
          orderBy: { seed: "asc" },
        },
      },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    const seededIds = tournament.players.map((p) => p.userId);
    let roundResult;

    await prisma.$transaction(async (tx) => {
      roundResult = await this._createRoundTx(tx, tournament, roundNumber, seededIds);
    });

    emitToTournament(tournamentId, "tournament:round-started", {
      tournamentId,
      roundNumber,
      pairings: roundResult.pairings,
    });

    return roundResult;
  }

  /**
   * Get round details and pairings
   */
  async getRound(tournamentId, roundNumber) {
    const num = parseInt(roundNumber, 10);
    if (isNaN(num) || num < 1) {
      throw new AppError("INVALID_ROUND", "roundNumber must be a positive integer", 400);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    const round = await prisma.tournamentRound.findUnique({
      where: {
        tournamentId_roundNumber: {
          tournamentId,
          roundNumber: num,
        },
      },
      include: {
        pairings: {
          orderBy: { boardNumber: "asc" },
          include: {
            game: {
              select: { id: true, status: true },
            },
          },
        },
      },
    });

    if (!round) {
      throw new AppError("ROUND_NOT_FOUND", `Round ${num} not found`, 404);
    }

    // Collect all player IDs
    const userIds = new Set();
    for (const p of round.pairings) {
      if (p.whiteId) userIds.add(p.whiteId);
      if (p.blackId) userIds.add(p.blackId);
    }

    const users = await prisma.user.findMany({
      where: { id: { in: Array.from(userIds) } },
      select: { id: true, name: true, rating: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const formattedPairings = round.pairings.map((p) => ({
      id: p.id,
      boardNumber: p.boardNumber,
      white: userMap.get(p.whiteId) || { id: p.whiteId, name: "Unknown", rating: null },
      black: p.blackId ? userMap.get(p.blackId) || { id: p.blackId, name: "Unknown", rating: null } : null,
      gameId: p.gameId,
      gameStatus: p.game ? p.game.status : null,
      result: p.result,
    }));

    return {
      round: {
        roundNumber: round.roundNumber,
        status: round.status,
        startedAt: round.startedAt,
        finishedAt: round.finishedAt,
        pairings: formattedPairings,
      },
    };
  }

  /**
   * Get user's current game in the tournament
   */
  async getMyGame(tournamentId, user) {
    const entry = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId,
          userId: user.id,
        },
      },
    });

    if (!entry || entry.withdrawn) {
      throw new AppError("NOT_IN_TOURNAMENT", "You are not a player in this tournament", 404);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      select: { id: true, status: true, currentRound: true },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status !== "ACTIVE") {
      return { status: tournament.status, gameId: null };
    }

    const round = await prisma.tournamentRound.findUnique({
      where: {
        tournamentId_roundNumber: {
          tournamentId,
          roundNumber: tournament.currentRound,
        },
      },
    });

    if (!round) {
      return { status: tournament.status, gameId: null };
    }

    const pairing = await prisma.tournamentPairing.findFirst({
      where: {
        roundId: round.id,
        OR: [{ whiteId: user.id }, { blackId: user.id }],
      },
      include: {
        game: {
          select: { id: true, gameCode: true, status: true },
        },
      },
    });

    if (!pairing) {
      return { status: tournament.status, gameId: null };
    }

    if (!pairing.blackId) {
      // Bye
      return {
        roundNumber: round.roundNumber,
        bye: true,
        gameId: null,
      };
    }

    const isWhite = pairing.whiteId === user.id;
    const opponentId = isWhite ? pairing.blackId : pairing.whiteId;

    const opponent = await prisma.user.findUnique({
      where: { id: opponentId },
      select: { id: true, name: true, rating: true },
    });

    return {
      roundNumber: round.roundNumber,
      boardNumber: pairing.boardNumber,
      gameId: pairing.gameId,
      gameCode: pairing.game ? pairing.game.gameCode : null,
      color: isWhite ? "WHITE" : "BLACK",
      opponent,
      gameStatus: pairing.game ? pairing.game.status : null,
    };
  }
}

module.exports = new TournamentRoundService();
