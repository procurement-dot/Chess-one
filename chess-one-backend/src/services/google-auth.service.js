const { OAuth2Client } = require("google-auth-library");
const config = require("../config/env");
const { AppError } = require("../middleware/error.middleware");

// Initialize Google OAuth2 client with configured client ID
const oauth2Client = new OAuth2Client(config.GOOGLE_CLIENT_ID);

/**
 * Cryptographically verify Google ID token and return normalized Google user
 * @param {string} idToken - The Google ID Token from the client
 * @returns {Promise<{ googleId: string, email: string, name: string, avatarUrl: string|null }>}
 */
async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new AppError("INVALID_TOKEN", "Google ID token is required", 400);
  }

  try {
    const audience = config.GOOGLE_CLIENT_ID ? [config.GOOGLE_CLIENT_ID] : undefined;

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("INVALID_GOOGLE_TOKEN", "Failed to retrieve Google token payload", 401);
    }

    const {
      sub,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    // Reject tokens without valid verified email
    if (!email || !email_verified) {
      throw new AppError(
        "UNVERIFIED_EMAIL",
        "Google account must have a verified email address",
        400
      );
    }

    if (!sub) {
      throw new AppError(
        "INVALID_GOOGLE_TOKEN",
        "Google ID token missing subject claim",
        401
      );
    }

    return {
      googleId: sub,
      email: email.toLowerCase().trim(),
      name: name || email.split("@")[0],
      avatarUrl: picture || null,
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // Any Google crypto verification failure
    throw new AppError(
      "INVALID_GOOGLE_TOKEN",
      `Google ID token verification failed: ${err.message}`,
      401
    );
  }
}

module.exports = {
  verifyGoogleIdToken,
};
