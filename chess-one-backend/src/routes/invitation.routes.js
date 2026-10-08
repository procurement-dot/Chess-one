const express = require("express");
const router = express.Router();
const invitationController = require("../controllers/invitation.controller");
const { authenticate } = require("../middleware/auth.middleware");

// All invitation routes require authentication
router.use(authenticate);

// Get invitations for authenticated player
router.get("/", invitationController.getInvitations);

// Accept & decline invitations
router.post("/:invitationId/accept", invitationController.acceptInvitation);
router.post("/:invitationId/decline", invitationController.declineInvitation);

// 1-Click quick challenge route
router.post("/quick-invite", invitationController.quickInvite);

module.exports = router;
