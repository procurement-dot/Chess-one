const prisma = require("../config/database");
const { AppError } = require("../middleware/error.middleware");
const { hasPermission } = require("../config/permissions");
const { emitToTournament } = require("../config/socket");

class TournamentService {
  /**
   * Format tournament details for responses
   */
  async getTournament(user, id) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        rounds: {
          orderBy: { roundNumber: "asc" },
          select: {
            roundNumber: true,
            status: true,
          },
        },
        players: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                rating: true,
              },
            },
          },
        },
      },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    const isOwner = tournament.createdBy === user.id || user.role === "ADMIN";
    const nonWithdrawnPlayers = tournament.players.filter((p) => !p.withdrawn);
    const isJoined = nonWithdrawnPlayers.some((p) => p.userId === user.id);
    const isPlayer = isJoined;
    const playerCount = nonWithdrawnPlayers.length;

    const canStart =
      isOwner &&
      tournament.status === "UPCOMING" &&
      playerCount >= 2;

    const canJoin =
      tournament.status === "UPCOMING" &&
      tournament.createdBy !== user.id &&
      hasPermission(user.role, "TOURNAMENT_JOIN") &&
      !isJoined &&
      playerCount < tournament.maxPlayers;

    const canLeave =
      tournament.status === "UPCOMING" &&
      isJoined;

    const canEdit =
      tournament.status === "UPCOMING" &&
      isOwner &&
      hasPermission(user.role, "TOURNAMENT_MANAGE");

    const canCancel =
      (tournament.status === "UPCOMING" || tournament.status === "ACTIVE") &&
      isOwner &&
      hasPermission(user.role, "TOURNAMENT_MANAGE");

    const sortedPlayers = [...nonWithdrawnPlayers]
      .sort((a, b) => (b.user.rating || 0) - (a.user.rating || 0))
      .map((p) => ({
        userId: p.userId,
        name: p.user.name,
        avatarUrl: p.user.avatarUrl || null,
        rating: p.user.rating,
        score: p.score,
        seed: p.seed,
        joinedAt: p.joinedAt,
      }));

    const roundsList = (tournament.rounds || []).map((r) => ({
      roundNumber: r.roundNumber,
      status: r.status,
    }));

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || null,
        format: tournament.format,
        status: tournament.status,
        timeControl: tournament.timeControl,
        totalRounds: tournament.totalRounds,
        currentRound: tournament.currentRound,
        maxPlayers: tournament.maxPlayers,
        playerCount,
        startsAt: tournament.startsAt,
        isRated: tournament.isRated,
        createdAt: tournament.createdAt,
        rounds: roundsList,
        organiser: {
          id: tournament.creator.id,
          name: tournament.creator.name,
          avatarUrl: tournament.creator.avatarUrl || null,
        },
      },
      players: sortedPlayers,
      rounds: roundsList,
      isOwner,
      isJoined,
      isPlayer,
      canStart,
      canJoin,
      canLeave,
      canEdit,
      canCancel,
    };
  }

  /**
   * Create a new tournament
   */
  async createTournament(user, data) {
    const tournament = await prisma.tournament.create({
      data: {
        name: data.name,
        description: data.description || null,
        format: data.format || "ROUND_ROBIN",
        timeControl: data.timeControl,
        maxPlayers: data.maxPlayers,
        startsAt: data.startsAt,
        isRated: data.isRated !== undefined ? data.isRated : true,
        createdBy: user.id,
        status: "UPCOMING",
      },
    });

    return this.getTournament(user, tournament.id);
  }

  /**
   * List tournaments with filters and pagination
   */
  async listTournaments(user, query) {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where = {};

    if (query.status) {
      where.status = query.status;
    } else {
      where.status = { not: "CANCELLED" };
    }

    if (query.mine === "true") {
      if (user.role === "ORGANISER" || user.role === "ADMIN") {
        where.createdBy = user.id;
      } else {
        where.players = { some: { userId: user.id } };
      }
    }

    const [total, items] = await Promise.all([
      prisma.tournament.count({ where }),
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startsAt: "asc" },
        include: {
          creator: {
            select: { id: true, name: true },
          },
          _count: {
            select: { players: true },
          },
          players: {
            where: { userId: user.id },
            select: { userId: true },
          },
        },
      }),
    ]);

    const tournaments = items.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      timeControl: t.timeControl,
      startsAt: t.startsAt,
      maxPlayers: t.maxPlayers,
      playerCount: t._count.players,
      isRated: t.isRated,
      organiser: {
        id: t.creator.id,
        name: t.creator.name,
      },
      isJoined: Boolean(t.players && t.players.length > 0),
      isOwner: t.createdBy === user.id || user.role === "ADMIN",
    }));

    return {
      tournaments,
      page,
      limit,
      total,
    };
  }

  /**
   * Update tournament
   */
  async updateTournament(user, id, data) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { players: true } },
      },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status !== "UPCOMING") {
      throw new AppError("TOURNAMENT_NOT_EDITABLE", "Tournament cannot be edited unless it is UPCOMING", 409);
    }

    const currentCount = tournament._count.players;
    if (data.maxPlayers !== undefined && data.maxPlayers < currentCount) {
      throw new AppError(
        "MAX_PLAYERS_TOO_LOW",
        `maxPlayers cannot be less than current player count (${currentCount})`,
        409
      );
    }

    await prisma.tournament.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    emitToTournament(id, "tournament:updated", { tournamentId: id, reason: "EDITED" });

    return this.getTournament(user, id);
  }

  /**
   * Cancel tournament
   */
  async cancelTournament(user, id) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status === "CANCELLED") {
      throw new AppError("TOURNAMENT_ALREADY_CANCELLED", "Tournament is already cancelled", 409);
    }

    if (tournament.status !== "UPCOMING" && tournament.status !== "ACTIVE") {
      throw new AppError("TOURNAMENT_NOT_CANCELABLE", "Only UPCOMING or ACTIVE tournaments can be cancelled", 409);
    }

    await prisma.tournament.update({
      where: { id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    emitToTournament(id, "tournament:updated", { tournamentId: id, reason: "CANCELLED" });

    return this.getTournament(user, id);
  }

  /**
   * Join tournament with concurrency safety
   */
  async joinTournament(user, id) {
    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await prisma.$transaction(
          async (tx) => {
            // 1. Tournament exists
            const tournament = await tx.tournament.findUnique({
              where: { id },
              include: {
                _count: { select: { players: true } },
                players: { where: { userId: user.id }, select: { id: true } },
              },
            });

            if (!tournament) {
              throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
            }

            // 2. status === UPCOMING
            if (tournament.status !== "UPCOMING") {
              throw new AppError("TOURNAMENT_NOT_OPEN", "Tournament is not open for joining", 409);
            }

            // 3. The user is not the creator
            if (tournament.createdBy === user.id) {
              throw new AppError("OWNER_CANNOT_JOIN", "Tournament creator cannot join as a player", 409);
            }

            // 4. Not already joined
            if (tournament.players.length > 0) {
              throw new AppError("ALREADY_JOINED", "You have already joined this tournament", 409);
            }

            // 5. Not full
            if (tournament._count.players >= tournament.maxPlayers) {
              throw new AppError("TOURNAMENT_FULL", "Tournament is full", 409);
            }

            // Insert player
            await tx.tournamentPlayer.create({
              data: {
                tournamentId: id,
                userId: user.id,
              },
            });
          },
          { isolationLevel: "Serializable" }
        );

        // Success
        break;
      } catch (err) {
        const isConflict =
          err.code === "P2034" ||
          err.cause?.originalCode === "40001" ||
          err.cause?.kind === "TransactionWriteConflict" ||
          err.message?.includes("TransactionWriteConflict") ||
          err.message?.includes("could not serialize access");

        if (isConflict) {
          attempt++;
          if (attempt >= maxRetries) {
            // Check if tournament is now full on conflict exhaustion
            const current = await prisma.tournament.findUnique({
              where: { id },
              include: { _count: { select: { players: true } } },
            });
            if (current && current._count.players >= current.maxPlayers) {
              throw new AppError("TOURNAMENT_FULL", "Tournament is full", 409);
            }
            throw err;
          }
          await new Promise((res) => setTimeout(res, 30 * attempt));
          continue;
        }
        if (err.code === "P2002") {
          throw new AppError("ALREADY_JOINED", "You have already joined this tournament", 409);
        }
        throw err;
      }
    }

    emitToTournament(id, "tournament:updated", { tournamentId: id, reason: "PLAYER_JOINED" });

    return this.getTournament(user, id);
  }

  /**
   * Leave tournament
   */
  async leaveTournament(user, id) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { id: true, status: true },
    });

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status !== "UPCOMING") {
      throw new AppError("TOURNAMENT_NOT_OPEN", "Cannot leave tournament once it has started or ended", 409);
    }

    const entry = await prisma.tournamentPlayer.findUnique({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: user.id,
        },
      },
    });

    if (!entry) {
      throw new AppError("NOT_JOINED", "You are not joined in this tournament", 404);
    }

    await prisma.tournamentPlayer.delete({
      where: {
        tournamentId_userId: {
          tournamentId: id,
          userId: user.id,
        },
      },
    });

    emitToTournament(id, "tournament:updated", { tournamentId: id, reason: "PLAYER_LEFT" });

    return this.getTournament(user, id);
  }
}

module.exports = new TournamentService();
