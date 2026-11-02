const crypto = require("crypto");

const CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a random 6-character code using crypto.randomInt
 * @param {number} length 
 * @returns {string}
 */
function generateCode(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    const idx = crypto.randomInt(0, CHARACTERS.length);
    code += CHARACTERS[idx];
  }
  return code;
}

/**
 * Generate a unique join code for a Class with up to 5 retries
 * @param {object} prisma 
 * @param {number} maxRetries 
 * @returns {Promise<string>}
 */
async function generateUniqueJoinCode(prisma, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const code = generateCode(6);
    const existing = await prisma.class.findUnique({
      where: { joinCode: code },
      select: { id: true },
    });
    if (!existing) {
      return code;
    }
  }
  throw new Error("Failed to generate unique join code after 5 attempts");
}

module.exports = {
  CHARACTERS,
  generateCode,
  generateUniqueJoinCode,
};
