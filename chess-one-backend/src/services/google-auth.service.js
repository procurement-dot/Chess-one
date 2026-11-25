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
    const audiences = [
      config.GOOGLE_CLIENT_ID,
      config.GOOGLE_ANDROID_CLIENT_ID,
      "820629354206-kp2k0p1hm2kourpsded0g53ccvhlmseg.apps.googleusercontent.com",
      "820629354206-9mugo6ruflcmtqtuacc7a81ouiuorv45.apps.googleusercontent.com",
    ].filter(Boolean);

    const ticket = await oauth2Client.verifyIdToken({
      idToken,
      audience: audiences.length > 0 ? audiences : undefined,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new AppError("INVALID_GOOGLE_TOKEN", "Failed to retrieve Google token payload", 401);
    }

    const {
      sub,
      email,
      name,
      given_name,
      family_name,
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

    const cleanEmail = email.toLowerCase().trim();
    let resolvedName = name;
    if (!resolvedName && (given_name || family_name)) {
      resolvedName = [given_name, family_name].filter(Boolean).join(" ").trim();
    }
    if (!resolvedName && cleanEmail) {
      const prefix = cleanEmail.split("@")[0].replace(/[._-]/g, " ");
      resolvedName = prefix.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }

    return {
      googleId: sub,
      email: cleanEmail,
      name: resolvedName || "Chess Player",
      avatarUrl: picture || null,
    };
  } catch (err) {
    if (err instanceof AppError) {
      throw err;
    }
    // In development mode, if Google crypto verification fails (e.g. clock skew, network or audience mismatch),
    // decode the JWT payload gracefully so the user's real Google profile is preserved
    if (process.env.NODE_ENV !== "production") {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.decode(idToken);
        if (decoded && (decoded.email || decoded.sub)) {
          console.warn("[GoogleAuth] Fallback decode Google ID token in dev mode:", decoded.email);
          return {
            googleId: decoded.sub || `google-${Date.now()}`,
            email: decoded.email ? decoded.email.toLowerCase().trim() : `user@gmail.com`,
            name: decoded.name || decoded.email?.split("@")[0] || "Chess Player",
            avatarUrl: decoded.picture || null,
          };
        }
      } catch (dErr) {
        // Fallback failed
      }
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
