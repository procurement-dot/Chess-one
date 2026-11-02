const authService = require("../services/auth.service");
const { toPublicUser } = require("../utils/user");

class AuthController {
  /**
   * POST /api/auth/google
   * Public endpoint to authenticate with Google ID Token
   */
  async googleAuth(req, res, next) {
    try {
      const { idToken } = req.validatedBody || req.body;
      const result = await authService.authenticateWithGoogle(idToken);
      const publicUser = toPublicUser(result.user);

      return res.status(200).json({
        success: true,
        token: result.token,
        user: publicUser,
        data: {
          token: result.token,
          user: publicUser,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/auth/me
   * Protected endpoint to get current authenticated user profile
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      return res.status(200).json({
        success: true,
        data: {
          user: toPublicUser(user),
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();
