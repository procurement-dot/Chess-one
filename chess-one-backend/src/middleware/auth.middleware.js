const prisma = require("../config/database");
const { verifyToken, generateToken } = require("../utils/jwt");

/**
 * Authoritative user authentication middleware
 * Requires a valid ChessOne JWT in the Authorization header:
 * Authorization: Bearer <ChessOne JWT>
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required: Missing Authorization header",
        },
      });
    }

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required: Malformed Authorization header. Expected 'Bearer <token>'",
        },
      });
    }

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required: Token is empty",
        },
      });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch (err) {
      const isExpired = err.name === "TokenExpiredError";
      return res.status(401).json({
        success: false,
        error: {
          code: isExpired ? "TOKEN_EXPIRED" : "UNAUTHORIZED",
          message: isExpired
            ? "Authentication token has expired"
            : "Invalid authentication token",
        },
      });
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid token payload: missing user ID",
        },
      });
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: parseInt(userId, 10) },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated user no longer exists",
        },
      });
    }

    // Attach verified user to request with integer id
    req.user = {
      ...user,
      id: parseInt(user.id, 10),
    };

    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
  authenticate: requireAuth, // Backward-compatibility
  generateToken, // Backward-compatibility
};
