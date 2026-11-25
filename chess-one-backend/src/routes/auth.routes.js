const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { googleAuthSchema, validate } = require("../validators/auth.validator");

/**
 * Public route to authenticate with Google ID token
 * POST /api/auth/google
 * Body: { idToken: "..." }
 */
router.post("/google", validate(googleAuthSchema), authController.googleAuth);

/**
 * Protected route to get authenticated user profile
 * GET /api/auth/me
 * Header: Authorization: Bearer <ChessOne JWT>
 */
router.get("/me", requireAuth, authController.getMe);

module.exports = router;
