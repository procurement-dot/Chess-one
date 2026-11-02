const express = require("express");
const crypto = require("crypto");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { googleAuthSchema, validate } = require("../validators/auth.validator");
const prisma = require("../config/database");
const config = require("../config/env");
const { generateToken } = require("../utils/jwt");
const { toPublicUser } = require("../utils/user");

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

/**
 * Dev login endpoint to issue JWT tokens for testing/development [Security fix S1]
 * POST /api/auth/dev-login
 * Body: { userId: 1 } or { email: "player1@chessone.local" }
 */
router.post("/dev-login", async (req, res, next) => {
  try {
    // 1. Guard: ENABLE_TEST_LOGIN !== "true" -> 404 ROUTE_NOT_FOUND
    if (config.ENABLE_TEST_LOGIN !== "true") {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route not found",
        },
      });
    }

    // 2. Guard: header x-qa-secret missing or != QA_LOGIN_SECRET -> 404 ROUTE_NOT_FOUND
    const qaSecretHeader = req.headers["x-qa-secret"];
    const expectedSecret = config.QA_LOGIN_SECRET;

    if (!qaSecretHeader || !expectedSecret) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route not found",
        },
      });
    }

    const headerBuf = Buffer.from(String(qaSecretHeader));
    const expectedBuf = Buffer.from(String(expectedSecret));

    if (
      headerBuf.length !== expectedBuf.length ||
      !crypto.timingSafeEqual(headerBuf, expectedBuf)
    ) {
      return res.status(404).json({
        success: false,
        error: {
          code: "ROUTE_NOT_FOUND",
          message: "Route not found",
        },
      });
    }

    const { userId, email } = req.body || {};
    const targetEmail = email ? String(email).trim().toLowerCase() : null;

    // 3. Guard: QA_ALLOWED_EMAILS set and user's email not in it -> 403 FORBIDDEN
    const allowedEmails = config.QA_ALLOWED_EMAILS || [];
    if (allowedEmails.length > 0 && targetEmail && !allowedEmails.includes(targetEmail)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Email is not permitted for test login",
        },
      });
    }

    // Lookup user in DB
    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
    } else if (targetEmail) {
      user = await prisma.user.findUnique({ where: { email: targetEmail } });
    }

    // If user was resolved by userId, check allowed emails against resolved user's email
    if (user && allowedEmails.length > 0 && !allowedEmails.includes(user.email.toLowerCase())) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Email is not permitted for test login",
        },
      });
    }

    // 4. Guard: user not found -> 404 USER_NOT_FOUND (do NOT auto-create users, except when NODE_ENV=development)
    if (!user) {
      if (config.NODE_ENV !== "development") {
        return res.status(404).json({
          success: false,
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
          },
        });
      }

      // In development mode only, auto-create test user
      const devEmail = targetEmail || `player${userId || 1}@chessone.local`;
      if (allowedEmails.length > 0 && !allowedEmails.includes(devEmail.toLowerCase())) {
        return res.status(403).json({
          success: false,
          error: {
            code: "FORBIDDEN",
            message: "Email is not permitted for test login",
          },
        });
      }

      const id = userId ? parseInt(userId, 10) : undefined;
      user = await prisma.user.create({
        data: {
          ...(id ? { id } : {}),
          name: devEmail.split("@")[0],
          email: devEmail,
        },
      });
    }

    const token = generateToken(user);
    return res.status(200).json({
      success: true,
      token,
      user: toPublicUser(user),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
