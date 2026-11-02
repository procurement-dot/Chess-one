const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/requireRole");
const { validate, adminRoleSchema } = require("../validators/class.validators");

// All admin routes require authentication and ADMIN role
router.use(authenticate);
router.use(requireRole("ADMIN"));

// 13. PATCH /api/admin/users/:userId/role
router.patch(
  "/users/:userId/role",
  validate(adminRoleSchema),
  adminController.updateUserRole
);

module.exports = router;
