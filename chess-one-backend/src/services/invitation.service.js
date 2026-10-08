const prisma = require("../config/database");
const { parseTimeControl } = require("./clock.service");
const { emitToGame, emitToUser } = require("../config/socket");
const { AppError } = require("../middleware/error.middleware");

class InvitationService {
  /**
   * Helper to resolve game by integer ID or string gameCode
   */
  async _findGame(identifier) {
    const isNum = !isNaN(identifier) && !isNaN(parseInt(identifier, 10));
    const where = isNum
      ? { id: parseInt(identifier, 10) }
      : { gameCode: identifier.toString().toUpperCase() };

    return prisma.game.findFirst({ where });
  }

  /**
   * Create an invitation to a player for a waiting game
   */
  async createInvitation({ gameId, senderId, opponentUserId }) {
    // 1. Validate opponent is not self
    if (senderId === opponentUserId) {
      throw new AppError("INVALID_INVITATION", "You cannot invite yourself", 400);
    }

    // 2. Validate game
    const game = await this._findGame(gameId);
    if (!game) {
      throw new AppError("GAME_NOT_FOUND", "Game not found", 404);
    }

    if (game.createdBy !== senderId) {
      throw new AppError("FORBIDDEN", "Only the game creator can invite players", 403);
    }

    if (game.gameType !== "PLAYER_VS_PLAYER") {
      throw new AppError("INVALID_GAME_TYPE", "Invitations are only available for Player vs Player games", 400);
    }

    if (game.status !== "WAITING") {
      throw new AppError("GAME_NOT_WAITING", "Cannot invite to a game that is already active or finished", 400);
    }

    // 3. Verify opponent exists
    const opponent = await prisma.user.findUnique({
      where: { id: opponentUserId },
    });

    if (!opponent) {
      throw new AppError("USER_NOT_FOUND", "Opponent user does not exist", 404);
    }

    // 4. Check for duplicate pending invitation
    const existing = await prisma.gameInvitation.findFirst({
      where: {
        gameId: game.id,
        receiverId: opponentUserId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    if (existing) {
      throw new AppError("DUPLICATE_INVITATION", "A pending invitation already exists for this player", 409);
    }

    // 5. Create invitation (15 minutes validity)
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    const invitation = await prisma.gameInvitation.create({
      data: {
        gameId: game.id,
        senderId,
        receiverId: opponentUserId,
        status: "PENDING",
        expiresAt,
      },
      include: {
        game: { select: { id: true, gameCode: true, timeControl: true } },
        sender: { select: { id: true, name: true, email: true } },
      },
    });

    // Notify opponent via Socket.IO
    emitToUser(opponentUserId, "invitation:received", {
      invitationId: invitation.id,
      gameId: game.id,
      gameCode: game.gameCode,
      sender: invitation.sender,
      timeControl: game.timeControl,
      expiresAt: invitation.expiresAt,
    });

    return {
      id: invitation.id,
      gameId: game.id,
      gameCode: game.gameCode,
      status: invitation.status,
      receiverId: opponentUserId,
      expiresAt: invitation.expiresAt,
    };
  }

  /**
   * Get all active pending invitations for a user
   */
  async getInvitations(userId) {
    const invitations = await prisma.gameInvitation.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
        game: { status: "WAITING" },
      },
      orderBy: { createdAt: "desc" },
      include: {
        sender: { select: { id: true, name: true, email: true } },
        game: { select: { id: true, gameCode: true, timeControl: true, status: true } },
      },
    });

    return invitations.map((inv) => ({
      id: inv.id,
      gameId: inv.game.id,
      gameCode: inv.game.gameCode,
      sender: inv.sender,
      timeControl: inv.game.timeControl,
      createdAt: inv.createdAt,
      expiresAt: inv.expiresAt,
    }));
  }

  /**
   * Accept an invitation and start the game atomically
   */
  async acceptInvitation({ invitationId, userId }) {
    const parsedId = parseInt(invitationId, 10);
    if (isNaN(parsedId)) {
      throw new AppError("INVALID_ID", "Invalid invitation ID", 400);
    }

    const invitation = await prisma.gameInvitation.findUnique({
      where: { id: parsedId },
      include: { game: true },
    });

    if (!invitation) {
      throw new AppError("INVITATION_NOT_FOUND", "Invitation not found", 404);
    }

    if (invitation.receiverId !== userId) {
      throw new AppError("FORBIDDEN", "This invitation was not sent to you", 403);
    }

    if (invitation.status !== "PENDING") {
      throw new AppError("INVITATION_ALREADY_RESPONDED", `Invitation is already ${invitation.status.toLowerCase()}`, 400);
    }

    if (new Date(invitation.expiresAt) <= new Date()) {
      await prisma.gameInvitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new AppError("INVITATION_EXPIRED", "Invitation has expired", 400);
    }

    const game = invitation.game;
    if (game.status !== "WAITING") {
      throw new AppError("GAME_ALREADY_STARTED", "Game is no longer waiting for players", 400);
    }

    // Determine colors
    let whitePlayerId = game.whitePlayerId;
    let blackPlayerId = game.blackPlayerId;
    let joiningPlayerColor = "BLACK";

    if (whitePlayerId && !blackPlayerId) {
      blackPlayerId = userId;
      joiningPlayerColor = "BLACK";
    } else if (blackPlayerId && !whitePlayerId) {
      whitePlayerId = userId;
      joiningPlayerColor = "WHITE";
    } else {
      // Creator didn't have assigned slot yet
      whitePlayerId = game.createdBy;
      blackPlayerId = userId;
      joiningPlayerColor = "BLACK";
    }

    const { initialTimeMs } = parseTimeControl(game.timeControl);
    const now = new Date();

    // Atomic transaction: accept invitation, cancel others, activate game
    const [updatedInvitation, updatedGame] = await prisma.$transaction([
      prisma.gameInvitation.update({
        where: { id: invitation.id },
        data: { status: "ACCEPTED", respondedAt: now },
      }),
      prisma.game.update({
        where: { id: game.id },
        data: {
          status: "ACTIVE",
          whitePlayerId,
          blackPlayerId,
          whiteTimeMs: initialTimeMs,
          blackTimeMs: initialTimeMs,
          startedAt: now,
          lastMoveAt: now,
        },
        include: {
          whitePlayer: { select: { id: true, name: true } },
          blackPlayer: { select: { id: true, name: true } },
        },
      }),
      prisma.gameInvitation.updateMany({
        where: {
          gameId: game.id,
          id: { not: invitation.id },
          status: "PENDING",
        },
        data: { status: "CANCELLED" },
      }),
    ]);

    // Broadcast game:started to the game room
    const startedPayload = {
      gameId: updatedGame.id,
      gameCode: updatedGame.gameCode,
      status: "ACTIVE",
      whitePlayer: updatedGame.whitePlayer,
      blackPlayer: updatedGame.blackPlayer,
      timeControl: updatedGame.timeControl,
      fen: updatedGame.fen,
      currentTurn: updatedGame.currentTurn,
      startedAt: updatedGame.startedAt,
    };

    emitToGame(updatedGame.id, "game:started", startedPayload);

    return {
      gameId: updatedGame.id,
      gameCode: updatedGame.gameCode,
      status: updatedGame.status,
      playerColor: joiningPlayerColor,
      whitePlayer: updatedGame.whitePlayer,
      blackPlayer: updatedGame.blackPlayer,
      timeControl: updatedGame.timeControl,
    };
  }

  /**
   * Decline an invitation
   */
  async declineInvitation({ invitationId, userId }) {
    const parsedId = parseInt(invitationId, 10);
    if (isNaN(parsedId)) {
      throw new AppError("INVALID_ID", "Invalid invitation ID", 400);
    }

    const invitation = await prisma.gameInvitation.findUnique({
      where: { id: parsedId },
    });

    if (!invitation) {
      throw new AppError("INVITATION_NOT_FOUND", "Invitation not found", 404);
    }

    if (invitation.receiverId !== userId) {
      throw new AppError("FORBIDDEN", "This invitation was not sent to you", 403);
    }

    if (invitation.status !== "PENDING") {
      throw new AppError("INVITATION_ALREADY_RESPONDED", `Invitation is already ${invitation.status.toLowerCase()}`, 400);
    }

    const updated = await prisma.gameInvitation.update({
      where: { id: invitation.id },
      data: { status: "REJECTED", respondedAt: new Date() },
    });

    emitToUser(invitation.senderId, "invitation:declined", {
      invitationId: invitation.id,
      gameId: invitation.gameId,
      declinedBy: userId,
    });

    return {
      id: updated.id,
      status: updated.status,
    };
  }

  /**
   * 1-Click quick challenge to an online player
   */
  async quickInvite({ senderId, opponentUserId, timeControl = "5+0", colorPreference = "WHITE" }) {
    const parsedOpponentId = parseInt(opponentUserId, 10);
    if (isNaN(parsedOpponentId)) {
      throw new AppError("INVALID_USER_ID", "Invalid opponent user ID", 400);
    }
    if (senderId === parsedOpponentId) {
      throw new AppError("INVALID_INVITATION", "You cannot invite yourself", 400);
    }

    // Verify opponent exists
    const opponent = await prisma.user.findUnique({
      where: { id: parsedOpponentId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    });
    if (!opponent) {
      throw new AppError("USER_NOT_FOUND", "Opponent user not found", 404);
    }

    // Lazy load gameService to avoid any circular dependency
    const gameService = require("./game.service");
    const game = await gameService.createGame({
      userId: senderId,
      gameType: "PLAYER_VS_PLAYER",
      timeControl: timeControl || "5+0",
      colorPreference: colorPreference || "WHITE",
    });

    // Create invitation & notify opponent
    const invitation = await this.createInvitation({
      gameId: game.gameId,
      senderId,
      opponentUserId: parsedOpponentId,
    });

    return {
      gameId: game.gameId,
      gameCode: game.gameCode,
      invitationId: invitation.id,
      opponent,
      timeControl: timeControl || "5+0",
    };
  }
}

module.exports = new InvitationService();
