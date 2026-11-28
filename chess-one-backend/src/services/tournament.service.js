const prisma = require("../config/database");
const { AppError } = require("../middleware/error.middleware");
const { hasPermission } = require("../config/permissions");
const { emitToTournament } = require("../config/socket");

const inMemoryTournaments = new Map();
let nextInMemoryTournamentId = 5000;

class TournamentService {
  /**
   * Format tournament details for responses
   */
  async getTournament(user, id) {
    const numId = parseInt(id, 10);
    let tournament = null;

    if (!Number.isNaN(numId) && inMemoryTournaments.has(numId)) {
      tournament = inMemoryTournaments.get(numId);
    } else {
      try {
        tournament = await prisma.tournament.findUnique({
          where: { id: numId },
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
      } catch (err) {
        console.warn("[Tournament] Prisma findUnique failed, checking inMemoryTournaments:", err.message);
        tournament = inMemoryTournaments.get(numId) || null;
      }
    }

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    const isOwner = tournament.createdBy === user.id || user.role === "ADMIN";
    const nonWithdrawnPlayers = (tournament.players || []).filter((p) => !p.withdrawn);
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
      .sort((a, b) => ((b.user && b.user.rating) || 0) - ((a.user && a.user.rating) || 0))
      .map((p) => ({
        userId: p.userId,
        name: p.user ? p.user.name : `User ${p.userId}`,
        avatarUrl: p.user?.avatarUrl || null,
        rating: p.user?.rating ?? 1200,
        score: p.score ?? 0,
        seed: p.seed ?? null,
        joinedAt: p.joinedAt,
      }));

    const roundsList = (tournament.rounds || []).map((r) => ({
      roundNumber: r.roundNumber,
      status: r.status,
    }));

    const organiser = tournament.creator
      ? {
          id: tournament.creator.id,
          name: tournament.creator.name,
          avatarUrl: tournament.creator.avatarUrl || null,
        }
      : {
          id: tournament.createdBy,
          name: `User ${tournament.createdBy}`,
          avatarUrl: null,
        };

    return {
      tournament: {
        id: tournament.id,
        name: tournament.name,
        description: tournament.description || null,
        format: tournament.format,
        status: tournament.status,
        timeControl: tournament.timeControl,
        totalRounds: tournament.totalRounds || 0,
        currentRound: tournament.currentRound || 0,
        maxPlayers: tournament.maxPlayers,
        playerCount,
        startsAt: tournament.startsAt,
        isRated: tournament.isRated,
        createdAt: tournament.createdAt,
        rounds: roundsList,
        organiser,
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
    let created = null;
    try {
      created = await prisma.tournament.create({
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

      return this.getTournament(user, created.id);
    } catch (err) {
      console.warn("[Tournament] Prisma createTournament failed, falling back to in-memory:", err.message);
      const memId = ++nextInMemoryTournamentId;
      const now = new Date();
      const memTournament = {
        id: memId,
        name: data.name,
        description: data.description || null,
        format: data.format || "ROUND_ROBIN",
        status: "UPCOMING",
        timeControl: data.timeControl,
        totalRounds: 0,
        currentRound: 0,
        maxPlayers: data.maxPlayers || 64,
        startsAt: data.startsAt ? new Date(data.startsAt) : new Date(Date.now() + 3600000),
        isRated: data.isRated !== undefined ? data.isRated : true,
        createdBy: user.id,
        createdAt: now,
        updatedAt: now,
        creator: {
          id: user.id,
          name: user.name || `User ${user.id}`,
          avatarUrl: user.avatarUrl || null,
        },
        rounds: [],
        players: [],
      };
      inMemoryTournaments.set(memId, memTournament);
      return this.getTournament(user, memId);
    }
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

    let total = 0;
    let items = [];
    let dbSuccess = false;

    try {
      const res = await Promise.all([
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
      total = res[0];
      items = res[1];
      dbSuccess = true;
    } catch (err) {
      console.warn("[Tournament] Prisma listTournaments failed, falling back to in-memory:", err.message);
    }

    const tournaments = items.map((t) => ({
      id: t.id,
      name: t.name,
      format: t.format,
      status: t.status,
      timeControl: t.timeControl,
      startsAt: t.startsAt,
      maxPlayers: t.maxPlayers,
      playerCount: t._count ? t._count.players : 0,
      isRated: t.isRated,
      organiser: {
        id: t.creator ? t.creator.id : t.createdBy,
        name: t.creator ? t.creator.name : `User ${t.createdBy}`,
      },
      isJoined: Boolean(t.players && t.players.length > 0),
      isOwner: t.createdBy === user.id || user.role === "ADMIN",
    }));

    // Merge in-memory tournaments that match the filters
    const existingIds = new Set(tournaments.map((t) => t.id));
    for (const [memId, memT] of inMemoryTournaments.entries()) {
      if (!existingIds.has(memId)) {
        if (!query.status || memT.status === query.status) {
          if (query.mine === "true") {
            const isOwner = memT.createdBy === user.id;
            const isJoined = (memT.players || []).some((p) => p.userId === user.id);
            if (!isOwner && !isJoined) continue;
          }
          tournaments.push({
            id: memT.id,
            name: memT.name,
            format: memT.format,
            status: memT.status,
            timeControl: memT.timeControl,
            startsAt: memT.startsAt,
            maxPlayers: memT.maxPlayers,
            playerCount: (memT.players || []).length,
            isRated: memT.isRated,
            organiser: {
              id: memT.creator?.id || memT.createdBy,
              name: memT.creator?.name || `User ${memT.createdBy}`,
            },
            isJoined: (memT.players || []).some((p) => p.userId === user.id),
            isOwner: memT.createdBy === user.id || user.role === "ADMIN",
          });
        }
      }
    }

    return {
      tournaments,
      page,
      limit,
      total: dbSuccess ? total + (tournaments.length - items.length) : tournaments.length,
    };
  }

  /**
   * Update tournament
   */
  async updateTournament(user, id, data) {
    const numId = parseInt(id, 10);
    if (inMemoryTournaments.has(numId)) {
      const tournament = inMemoryTournaments.get(numId);
      if (tournament.status !== "UPCOMING") {
        throw new AppError("TOURNAMENT_NOT_EDITABLE", "Tournament cannot be edited unless it is UPCOMING", 409);
      }
      const currentCount = (tournament.players || []).length;
      if (data.maxPlayers !== undefined && data.maxPlayers < currentCount) {
        throw new AppError(
          "MAX_PLAYERS_TOO_LOW",
          `maxPlayers cannot be less than current player count (${currentCount})`,
          409
        );
      }
      Object.assign(tournament, data, { updatedAt: new Date() });
      emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "EDITED" });
      return this.getTournament(user, numId);
    }

    let tournament = null;
    try {
      tournament = await prisma.tournament.findUnique({
        where: { id: numId },
        include: {
          _count: { select: { players: true } },
        },
      });
    } catch (err) {
      console.warn("[Tournament] Prisma updateTournament findUnique failed:", err.message);
    }

    if (!tournament) {
      throw new AppError("TOURNAMENT_NOT_FOUND", "Tournament not found", 404);
    }

    if (tournament.status !== "UPCOMING") {
      throw new AppError("TOURNAMENT_NOT_EDITABLE", "Tournament cannot be edited unless it is UPCOMING", 409);
    }

    const currentCount = tournament._count ? tournament._count.players : 0;
    if (data.maxPlayers !== undefined && data.maxPlayers < currentCount) {
      throw new AppError(
        "MAX_PLAYERS_TOO_LOW",
        `maxPlayers cannot be less than current player count (${currentCount})`,
        409
      );
    }

    await prisma.tournament.update({
      where: { id: numId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
    });

    emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "EDITED" });

    return this.getTournament(user, numId);
  }

  /**
   * Cancel tournament
   */
  async cancelTournament(user, id) {
    const numId = parseInt(id, 10);
    if (inMemoryTournaments.has(numId)) {
      const tournament = inMemoryTournaments.get(numId);
      if (tournament.status === "CANCELLED") {
        throw new AppError("TOURNAMENT_ALREADY_CANCELLED", "Tournament is already cancelled", 409);
      }
      if (tournament.status !== "UPCOMING" && tournament.status !== "ACTIVE") {
        throw new AppError("TOURNAMENT_NOT_CANCELABLE", "Only UPCOMING or ACTIVE tournaments can be cancelled", 409);
      }
      tournament.status = "CANCELLED";
      tournament.cancelledAt = new Date();
      tournament.updatedAt = new Date();
      emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "CANCELLED" });
      return this.getTournament(user, numId);
    }

    let tournament = null;
    try {
      tournament = await prisma.tournament.findUnique({
        where: { id: numId },
        select: { id: true, status: true },
      });
    } catch (err) {
      console.warn("[Tournament] Prisma cancelTournament findUnique failed:", err.message);
    }

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
      where: { id: numId },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "CANCELLED" });

    return this.getTournament(user, numId);
  }

  /**
   * Join tournament with concurrency safety
   */
  async joinTournament(user, id) {
    const numId = parseInt(id, 10);
    if (inMemoryTournaments.has(numId)) {
      const tournament = inMemoryTournaments.get(numId);
      if (tournament.status !== "UPCOMING") {
        throw new AppError("TOURNAMENT_NOT_OPEN", "Tournament is not open for joining", 409);
      }
      if (tournament.createdBy === user.id) {
        throw new AppError("OWNER_CANNOT_JOIN", "Tournament creator cannot join as a player", 409);
      }
      if ((tournament.players || []).some((p) => p.userId === user.id)) {
        throw new AppError("ALREADY_JOINED", "You have already joined this tournament", 409);
      }
      if ((tournament.players || []).length >= tournament.maxPlayers) {
        throw new AppError("TOURNAMENT_FULL", "Tournament is full", 409);
      }
      tournament.players.push({
        id: Date.now(),
        tournamentId: numId,
        userId: user.id,
        user: {
          id: user.id,
          name: user.name || `User ${user.id}`,
          avatarUrl: user.avatarUrl || null,
          rating: user.rating || 1200,
        },
        score: 0,
        seed: null,
        withdrawn: false,
        joinedAt: new Date(),
      });
      emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "PLAYER_JOINED" });
      return this.getTournament(user, numId);
    }

    const maxRetries = 5;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        await prisma.$transaction(
          async (tx) => {
            // 1. Tournament exists
            const tournament = await tx.tournament.findUnique({
              where: { id: numId },
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
                tournamentId: numId,
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
              where: { id: numId },
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

    emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "PLAYER_JOINED" });

    return this.getTournament(user, numId);
  }

  /**
   * Leave tournament
   */
  async leaveTournament(user, id) {
    const numId = parseInt(id, 10);
    if (inMemoryTournaments.has(numId)) {
      const tournament = inMemoryTournaments.get(numId);
      if (tournament.status !== "UPCOMING") {
        throw new AppError("TOURNAMENT_NOT_OPEN", "Cannot leave tournament once it has started or ended", 409);
      }
      const playerIndex = (tournament.players || []).findIndex((p) => p.userId === user.id);
      if (playerIndex === -1) {
        throw new AppError("NOT_JOINED", "You are not joined in this tournament", 404);
      }
      tournament.players.splice(playerIndex, 1);
      emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "PLAYER_LEFT" });
      return this.getTournament(user, numId);
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id: numId },
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
          tournamentId: numId,
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
          tournamentId: numId,
          userId: user.id,
        },
      },
    });

    emitToTournament(numId, "tournament:updated", { tournamentId: numId, reason: "PLAYER_LEFT" });

    return this.getTournament(user, numId);
  }
}

const service = new TournamentService();
service.inMemoryTournaments = inMemoryTournaments;
module.exports = service;
