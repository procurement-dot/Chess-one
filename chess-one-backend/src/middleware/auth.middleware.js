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

    // Verify user exists in database or in memory store
    let user = null;
    const userStore = require("../store/user.store");

    try {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          rating: true,
        },
      });
      if (user) {
        userStore.upsertUser(user);
      }
    } catch (dbErr) {
      console.warn("[AuthMiddleware] Database query failed (fallback to userStore/token):", dbErr.message);
    }

    if (!user) {
      user = userStore.getUser(parseInt(userId, 10));
      if (!user && decoded.email) {
        user = userStore.getUserByEmail(decoded.email);
      }
    }

    // If still not in store, reconstruct user from verified signed JWT claims
    if (!user && (decoded.email || decoded.name || userId)) {
      user = {
        id: parseInt(userId, 10),
        name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : `Player ${userId}`),
        email: decoded.email || `player${userId}@chessone.local`,
        avatarUrl: decoded.avatarUrl || null,
        role: decoded.role || "STUDENT",
        rating: decoded.rating || 1200,
      };
      userStore.upsertUser(user);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authenticated user no longer exists",
        },
      });
    }

    // Support active role header from mobile role-switcher
    const headerRole = req.headers["x-user-role"] || req.headers["x-role"];
    let activeRole = user.role;
    if (headerRole && typeof headerRole === "string") {
      const upperRole = headerRole.toUpperCase().trim();
      if (["STUDENT", "COACH", "SCHOOL", "ORGANISER", "PARENT"].includes(upperRole)) {
        activeRole = upperRole;
      }
    }

    // Attach verified user to request with integer id
    req.user = {
      ...user,
      role: activeRole,
      id: parseInt(user.id, 10),
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || null,
      role: user.role,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication middleware:
 * Populates req.user if a valid token is present, but allows guest requests through.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      req.user = null;
      return next();
    }

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      req.user = null;
      return next();
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      req.user = null;
      return next();
    }

    const userId = decoded.userId || decoded.id;
    if (!userId) {
      req.user = null;
      return next();
    }

    let user = null;
    const userStore = require("../store/user.store");

    try {
      user = await prisma.user.findUnique({
        where: { id: parseInt(userId, 10) },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          rating: true,
        },
      });
      if (user) {
        userStore.upsertUser(user);
      }
    } catch (dbErr) {
      // Database query failed, fallback to memory
    }

    if (!user) {
      user = userStore.getUser(parseInt(userId, 10));
      if (!user && decoded.email) {
        user = userStore.getUserByEmail(decoded.email);
      }
    }

    if (!user && (decoded.email || decoded.name || userId)) {
      user = {
        id: parseInt(userId, 10),
        name: decoded.name || (decoded.email ? decoded.email.split("@")[0] : `Player ${userId}`),
        email: decoded.email || `player${userId}@chessone.local`,
        avatarUrl: decoded.avatarUrl || null,
        role: decoded.role || "STUDENT",
        rating: decoded.rating || 1200,
      };
      userStore.upsertUser(user);
    }

    if (user) {
      const headerRole = req.headers["x-user-role"] || req.headers["x-role"];
      let activeRole = user.role;
      if (headerRole && typeof headerRole === "string") {
        const upperRole = headerRole.toUpperCase().trim();
        if (["STUDENT", "COACH", "SCHOOL", "ORGANISER", "PARENT"].includes(upperRole)) {
          activeRole = upperRole;
        }
      }

      req.user = {
        ...user,
        role: activeRole,
        id: parseInt(user.id, 10),
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
}

const { forbidden, unauthorized } = require("./rbac.middleware");

/**
 * Reusable RBAC guard middleware
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res);
    }
    if (!roles.includes(req.user.role)) {
      return forbidden(res);
    }
    next();
  };
}

module.exports = {
  requireAuth,
  optionalAuth,
  authenticate: requireAuth, // Backward-compatibility
  generateToken, // Backward-compatibility
  requireRole,
};
