const invitationService = require("../services/invitation.service");
const { success } = require("../utils/response");

class InvitationController {
  async createInvitation(req, res, next) {
    try {
      const { gameId } = req.params;
      const { opponentUserId } = req.validatedBody;
      const result = await invitationService.createInvitation({
        gameId,
        senderId: req.user.id,
        opponentUserId,
      });

      return success(res, { invitation: result }, 201);
    } catch (err) {
      next(err);
    }
  }

  async getInvitations(req, res, next) {
    try {
      const invitations = await invitationService.getInvitations(req.user.id);
      return success(res, { invitations });
    } catch (err) {
      next(err);
    }
  }

  async acceptInvitation(req, res, next) {
    try {
      const { invitationId } = req.params;
      const result = await invitationService.acceptInvitation({
        invitationId,
        userId: req.user.id,
      });

      return success(res, { game: result });
    } catch (err) {
      next(err);
    }
  }

  async declineInvitation(req, res, next) {
    try {
      const { invitationId } = req.params;
      const result = await invitationService.declineInvitation({
        invitationId,
        userId: req.user.id,
      });

      return success(res, { invitation: result });
    } catch (err) {
      next(err);
    }
  }

  async quickInvite(req, res, next) {
    try {
      const { opponentUserId, timeControl, colorPreference } = req.body;
      const result = await invitationService.quickInvite({
        senderId: req.user.id,
        opponentUserId,
        timeControl,
        colorPreference,
      });

      return success(res, result, 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new InvitationController();
