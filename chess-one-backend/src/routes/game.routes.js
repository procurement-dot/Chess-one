const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");
const invitationController = require("../controllers/invitation.controller");
const { authenticate } = require("../middleware/auth.middleware");
const {
  createGameSchema,
  makeMoveSchema,
  validate: validateGame,
} = require("../validators/game.validator");
const {
  createInvitationSchema,
  validate: validateInvitation,
} = require("../validators/invitation.validator");

// All game routes require authentication
router.use(authenticate);

// Game creation & listing
router.post("/", validateGame(createGameSchema), gameController.createGame);
router.get("/my-games", gameController.getMyGames);

// Game state & details
router.get("/:gameId", gameController.getGame);
router.get("/:gameId/state", gameController.getGameState);
router.post("/:gameId/join", gameController.joinGame);
router.post("/:gameId/cancel", gameController.cancelGame);

// Invitation initiation via game endpoint (Section 10)
router.post(
  "/:gameId/invite",
  validateInvitation(createInvitationSchema),
  invitationController.createInvitation
);

// Moves & gameplay
router.post("/:gameId/moves", validateGame(makeMoveSchema), gameController.makeMove);
router.get("/:gameId/moves", gameController.getGameMoves);
router.get("/:gameId/pgn", gameController.getGamePgn);
router.get("/:gameId/result", gameController.getGameResult);
router.all("/:gameId/ai-review", gameController.getAiReview);

// End game actions: resign, abort & draws
router.post("/:gameId/abort", gameController.abortGame);
router.post("/:gameId/resign", gameController.resign);
router.post("/:gameId/draw-offer", gameController.offerDraw);
router.post("/:gameId/draw-accept", gameController.acceptDraw);
router.post("/:gameId/draw-reject", gameController.rejectDraw);

module.exports = router;
