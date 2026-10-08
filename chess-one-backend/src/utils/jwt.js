const jwt = require("jsonwebtoken");
const config = require("../config/env");

/**
 * Generate a ChessOne JWT token for a user
 * @param {object} user - User record from database
 * @returns {string} Signed JWT
 */
function generateToken(user) {
  const id = parseInt(user.id, 10);
  const payload = {
    userId: id,
    id, // Backwards-compatibility with existing code
    email: user.email,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN || "7d",
  });
}

/**
 * Verify and decode a ChessOne JWT token
 * @param {string} token - Bearer JWT string
 * @returns {object} Decoded JWT payload
 */
function verifyToken(token) {
  return jwt.verify(token, config.JWT_SECRET);
}

module.exports = {
  generateToken,
  verifyToken,
};
