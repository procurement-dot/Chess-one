/**
 * Normalize and return public user profile
 * @param {object} user - User record from database
 * @returns {object|null} Public user profile
 */
function toPublicUser(user) {
  if (!user) return null;
  return {
    id: parseInt(user.id, 10),
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl || null,
    role: user.role,
  };
}

module.exports = {
  toPublicUser,
  sanitizeUser: toPublicUser,
};
