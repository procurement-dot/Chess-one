const { PERMISSIONS, hasPermission } = require("../config/permissions");

function forbidden(res, message = "You do not have permission to do this") {
  return res.status(403).json({ success: false, error: { code: "FORBIDDEN", message } });
}

function unauthorized(res) {
  return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Authentication required" } });
}

// Usage: router.post("/", requireAuth, requirePermission("TOURNAMENT_CREATE"), handler)
function requirePermission(...permissions) {
  for (const p of permissions) {
    if (!PERMISSIONS[p]) throw new Error(`requirePermission: unknown permission "${p}"`); // fails at startup
  }
  return (req, res, next) => {
    if (!req.user) return unauthorized(res);
    const ok = permissions.some((p) => hasPermission(req.user.role, p));
    return ok ? next() : forbidden(res);
  };
}

// Generic ownership guard.
// getOwnerId(req) → Promise<number|null>  (null = resource not found → 404)
// ADMIN always passes.
function requireOwnership(getOwnerId, { notFoundCode = "NOT_FOUND", notFoundMessage = "Resource not found" } = {}) {
  return async (req, res, next) => {
    try {
      if (!req.user) return unauthorized(res);
      const ownerId = await getOwnerId(req);
      if (ownerId === null || ownerId === undefined) {
        return res.status(404).json({ success: false, error: { code: notFoundCode, message: notFoundMessage } });
      }
      if (req.user.role === "ADMIN" || Number(ownerId) === Number(req.user.id)) return next();
      return forbidden(res);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = { requirePermission, requireOwnership, forbidden, unauthorized };
