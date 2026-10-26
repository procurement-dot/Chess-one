const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middleware/auth.middleware");
const { requirePermission, requireOwnership } = require("../middleware/rbac.middleware");
const { success } = require("../utils/response");

router.use(requireAuth);
router.get("/whoami", (req, res) => success(res, { user: { id: req.user.id, role: req.user.role } }));
router.get("/organiser", requirePermission("TOURNAMENT_CREATE"), (req, res) => success(res, { ok: true }));
router.get("/student", requirePermission("TOURNAMENT_JOIN"), (req, res) => success(res, { ok: true }));
router.get("/owner/:ownerId", requireOwnership(async (req) => parseInt(req.params.ownerId, 10)), (req, res) => success(res, { ok: true }));

module.exports = router;
