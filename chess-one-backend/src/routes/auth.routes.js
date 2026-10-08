const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middleware/auth.middleware");
const { googleAuthSchema, validate } = require("../validators/auth.validator");
const prisma = require("../config/database");
const { generateToken } = require("../utils/jwt");
const { success } = require("../utils/response");

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
 * Dev login endpoint to issue JWT tokens for testing/development
 * POST /api/auth/dev-login
 * Body: { userId: 1 } or { email: "player1@chessone.local" }
 */
router.post("/dev-login", async (req, res, next) => {
  try {
    const { userId, email } = req.body;

    let user = null;
    if (userId) {
      user = await prisma.user.findUnique({ where: { id: parseInt(userId, 10) } });
    } else if (email) {
      user = await prisma.user.findUnique({ where: { email } });
    }

    if (!user) {
      const id = userId ? parseInt(userId, 10) : undefined;
      user = await prisma.user.create({
        data: {
          ...(id ? { id } : {}),
          name: email ? email.split("@")[0] : `Player ${userId || 1}`,
          email: email || `player${userId || 1}@chessone.local`,
        },
      });
    }

    const token = generateToken(user);
    return success(res, {
      token,
      user: {
        id: parseInt(user.id, 10),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl || null,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
