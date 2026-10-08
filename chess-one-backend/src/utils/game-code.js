const crypto = require("crypto");

/**
 * Generate a random 6-character uppercase alphanumeric game code
 */
function generateGameCode(length = 6) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Removed ambiguous characters like 0/O, 1/I
  let code = "";
  const randomBytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i++) {
    code += characters[randomBytes[i] % characters.length];
  }
  return code;
}

module.exports = {
  generateGameCode,
};
