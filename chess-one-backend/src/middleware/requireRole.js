/**
 * Require specific user role(s) to access route
 * If no req.user -> 401 UNAUTHORIZED
 * If role not allowed -> 403 COACH_ROLE_REQUIRED
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "COACH_ROLE_REQUIRED",
          message: "Coach role required",
        },
      });
    }

    next();
  };
}

module.exports = {
  requireRole,
};
