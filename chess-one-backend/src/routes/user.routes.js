const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requireAuth, optionalAuth } = require("../middleware/auth.middleware");
const {
  updateProfileSchema,
  blockPrivilegedRole,
  validate,
} = require("../validators/user.validator");

// Profile endpoints require authentication
router.get("/me", requireAuth, userController.getMe);
router.patch("/me", requireAuth, blockPrivilegedRole, validate(updateProfileSchema), userController.updateMe);

// User listing endpoints require authentication
router.get("/", requireAuth, userController.getUsers);
router.get("/online", requireAuth, userController.getUsers);

module.exports = router;
