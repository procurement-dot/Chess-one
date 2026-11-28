const express = require("express");
const router = express.Router();

const ctrl = require("../controllers/tournament.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { requirePermission } = require("../middleware/rbac.middleware");
const { requireTournamentOwner } = require("../middleware/tournament.middleware");
const {
  createTournamentSchema,
  updateTournamentSchema,
  listTournamentsQuery,
  validate,
  validateQuery,
  checkId,
} = require("../validators/tournament.validator");

router.use(requireAuth);

router.get("/", validateQuery(listTournamentsQuery), ctrl.list);
router.get("/:id", checkId, ctrl.getOne);

router.post("/", requirePermission("TOURNAMENT_CREATE"), validate(createTournamentSchema), ctrl.create);
router.patch(
  "/:id",
  checkId,
  requirePermission("TOURNAMENT_MANAGE"),
  requireTournamentOwner,
  validate(updateTournamentSchema),
  ctrl.update
);
router.post(
  "/:id/cancel",
  checkId,
  requirePermission("TOURNAMENT_MANAGE"),
  requireTournamentOwner,
  ctrl.cancel
);

router.post("/:id/join", checkId, requirePermission("TOURNAMENT_JOIN"), ctrl.join);
router.post("/:id/leave", checkId, requirePermission("TOURNAMENT_JOIN"), ctrl.leave);

router.post(
  "/:id/start",
  checkId,
  requirePermission("TOURNAMENT_MANAGE"),
  requireTournamentOwner,
  ctrl.start
);
router.get("/:id/rounds/:roundNumber", checkId, ctrl.getRound);
router.get("/:id/my-game", checkId, ctrl.myGame);

module.exports = router;
