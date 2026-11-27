const ROLES = Object.freeze({
  STUDENT: "STUDENT",
  PARENT: "PARENT",
  COACH: "COACH",
  SCHOOL: "SCHOOL",
  ORGANISER: "ORGANISER",
  ADMIN: "ADMIN",
});

// One place that says who can do what.
// ADMIN is NOT listed everywhere on purpose — hasPermission() always allows ADMIN.
const PERMISSIONS = Object.freeze({
  // Tournaments
  TOURNAMENT_VIEW:          ["STUDENT", "PARENT", "COACH", "SCHOOL", "ORGANISER"],
  TOURNAMENT_CREATE:        ["ORGANISER"],
  TOURNAMENT_MANAGE:        ["ORGANISER"],   // edit/cancel/start/next round/results (+ ownership check)
  TOURNAMENT_JOIN:          ["STUDENT"],
  // Future (placeholders, not used yet)
  CLASS_MANAGE:             ["COACH", "SCHOOL"],
  CHILD_PROGRESS_VIEW:      ["PARENT"],
});

function hasPermission(role, permission) {
  if (!role) return false;
  if (role === ROLES.ADMIN) return true;
  const allowed = PERMISSIONS[permission];
  if (!allowed) throw new Error(`Unknown permission: ${permission}`);
  return allowed.includes(role);
}

module.exports = { ROLES, PERMISSIONS, hasPermission };
