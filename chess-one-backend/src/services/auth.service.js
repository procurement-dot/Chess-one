const prisma = require("../config/database");
const { verifyGoogleIdToken } = require("./google-auth.service");
const { generateToken } = require("../utils/jwt");
const { AppError } = require("../middleware/error.middleware");

class AuthService {
  /**
   * Authenticate user with Google ID token
   * Finds existing user by googleId or email, or creates a new user.
   * Returns ChessOne JWT and normalized user profile.
   */
  async authenticateWithGoogle(idToken) {
    // 1. Verify Google ID token cryptographically
    const googleUser = await verifyGoogleIdToken(idToken);
    const { googleId, email, name, avatarUrl } = googleUser;

    // 2. Search User by googleId first or by email
    let user = null;
    if (googleId) {
      user = await prisma.user.findUnique({
        where: { googleId },
      });
    }

    if (!user && email) {
      user = await prisma.user.findUnique({
        where: { email },
      });
    }

    if (user) {
      // User found - update googleId if not linked, or update avatar/name
      const updateData = {};
      if (googleId && user.googleId !== googleId) {
        updateData.googleId = googleId;
      }
      if (avatarUrl && !user.avatarUrl) {
        updateData.avatarUrl = avatarUrl;
      }
      if (name && (user.name.startsWith("Player ") || !user.name)) {
        updateData.name = name;
      }

      if (Object.keys(updateData).length > 0) {
        try {
          user = await prisma.user.update({
            where: { id: user.id },
            data: updateData,
          });
        } catch (updateErr) {
          if (updateErr.code !== "P2002") {
            throw updateErr;
          }
        }
      }
    } else {
      // 3. User does not exist, create safely
      try {
        user = await prisma.user.create({
          data: {
            name: name || "Chess Player",
            email,
            googleId,
            avatarUrl: avatarUrl || null,
          },
        });
      } catch (createErr) {
        // If a concurrent request created the user (P2002), retrieve the created user
        if (createErr.code === "P2002") {
          user = await prisma.user.findFirst({
            where: {
              OR: [
                ...(googleId ? [{ googleId }] : []),
                ...(email ? [{ email }] : []),
              ],
            },
          });
          if (!user) {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // 5. Generate ChessOne JWT
    const token = generateToken(user);

    return {
      token,
      user: {
        id: parseInt(user.id, 10),
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
    };
  }

  /**
   * Get user profile by database ID
   */
  async getUserById(userId) {
    const numericId = parseInt(userId, 10);
    const user = await prisma.user.findUnique({
      where: { id: numericId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new AppError("USER_NOT_FOUND", "Authenticated user not found", 404);
    }

    return {
      ...user,
      id: parseInt(user.id, 10),
    };
  }
}

module.exports = new AuthService();
