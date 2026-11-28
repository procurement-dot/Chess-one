const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");
const invitationController = require("../controllers/invitation.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const {
  createGameSchema,
  makeMoveSchema,
  aiMoveSchema,
  validate: validateGame,
} = require("../validators/game.validator");
const {
  createInvitationSchema,
  validate: validateInvitation,
} = require("../validators/invitation.validator");

// Game creation & listing
router.post("/", requireAuth, validateGame(createGameSchema), gameController.createGame);
router.get("/my-games", requireAuth, gameController.getMyGames);

// Game state & details (allow optionalAuth so game board view never fails with 401)
router.get("/:gameId", optionalAuth, gameController.getGame);
router.get("/:gameId/state", optionalAuth, gameController.getGameState);
router.post("/:gameId/join", requireAuth, gameController.joinGame);
router.post("/:gameId/cancel", requireAuth, gameController.cancelGame);

// Invitation initiation via game endpoint
router.post(
  "/:gameId/invite",
  requireAuth,
  validateInvitation(createInvitationSchema),
  invitationController.createInvitation
);

// Moves & gameplay
router.post("/:gameId/moves", requireAuth, validateGame(makeMoveSchema), gameController.makeMove);
router.post("/:gameId/ai-move", optionalAuth, validateGame(aiMoveSchema), gameController.getAiMove);
router.get("/:gameId/moves", optionalAuth, gameController.getGameMoves);
router.get("/:gameId/pgn", optionalAuth, gameController.getGamePgn);
router.get("/:gameId/result", optionalAuth, gameController.getGameResult);
router.post("/:gameId/finish-ai", optionalAuth, gameController.finishAiGame);
router.all("/:gameId/ai-review", optionalAuth, gameController.getAiReview);

// End game actions: resign, abort & draws
router.post("/:gameId/abort", requireAuth, gameController.abortGame);
router.post("/:gameId/resign", requireAuth, gameController.resign);
router.post("/:gameId/draw-offer", requireAuth, gameController.offerDraw);
router.post("/:gameId/draw-accept", requireAuth, gameController.acceptDraw);
router.post("/:gameId/draw-reject", requireAuth, gameController.rejectDraw);

module.exports = router;
