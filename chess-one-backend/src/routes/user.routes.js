const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const {
  updateProfileSchema,
  blockPrivilegedRole,
  validate,
} = require("../validators/user.validator");

// Require authentication for user listing and profile endpoints
router.use(requireAuth);

router.get("/me", userController.getMe);
router.patch("/me", blockPrivilegedRole, validate(updateProfileSchema), userController.updateMe);

router.get("/", userController.getUsers);
router.get("/online", userController.getUsers);

module.exports = router;
