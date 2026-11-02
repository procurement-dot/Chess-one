const { generateCode } = require("./joinCode");

/**
 * Generate a random 6-character uppercase alphanumeric game code
 */
function generateGameCode(length = 6) {
  return generateCode(length);
}

module.exports = {
  generateGameCode,
};
