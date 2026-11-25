const prisma = require("../config/database");
const { verifyGoogleIdToken } = require("./google-auth.service");
const { generateToken } = require("../utils/jwt");
const { AppError } = require("../middleware/error.middleware");
const userStore = require("../store/user.store");

class AuthService {
  /**
   * Authenticate user with Google ID token
   * Finds existing user by googleId or email, or creates a new user.
   * Returns ChessOne JWT and normalized user profile.
   */
  async authenticateWithGoogle(idToken, clientProfile = {}) {
    // 1. Verify Google ID token cryptographically
    const googleUser = await verifyGoogleIdToken(idToken);
    const { googleId, email, name, avatarUrl } = googleUser;

    const effectiveName =
      clientProfile?.name && !clientProfile.name.startsWith("Player")
        ? clientProfile.name.trim()
        : name && !name.startsWith("Player")
        ? name.trim()
        : null;

    const effectiveAvatar = clientProfile?.avatarUrl || avatarUrl || null;

    // 2. Search User by googleId first or by email in database
    let user = null;
    try {
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
        if (effectiveAvatar && !user.avatarUrl) {
          updateData.avatarUrl = effectiveAvatar;
        }
        if (effectiveName && (!user.name || user.name.startsWith("Player ") || user.name.startsWith("Player #") || user.name === "Chess Player")) {
          updateData.name = effectiveName;
        }

        if (Object.keys(updateData).length > 0) {
          try {
            user = await prisma.user.update({
              where: { id: user.id },
              data: updateData,
            });
          } catch (updateErr) {
            console.warn("[Auth] Failed to update user profile in DB:", updateErr.message);
            user = { ...user, ...updateData };
          }
        }
      } else {
        // 3. User does not exist, create safely
        try {
          user = await prisma.user.create({
            data: {
              name: effectiveName || (email ? email.split("@")[0] : "Chess Player"),
              email,
              googleId,
              avatarUrl: effectiveAvatar,
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
    } catch (dbErr) {
      console.warn("[Auth] Database operation failed during Google authentication, falling back to session store:", dbErr.message);
      let memUser = email ? userStore.getUserByEmail(email) : null;
      if (!memUser) {
        const pseudoId = Math.floor(1000 + Math.random() * 9000);
        memUser = {
          id: pseudoId,
          name: effectiveName || (email ? email.split("@")[0] : "Chess Player"),
          email,
          googleId,
          avatarUrl: effectiveAvatar,
          role: "STUDENT",
          rating: 1200,
          onboardingDone: true,
        };
      }
      user = memUser;
    }

    // Determine authoritative display name
    const resolvedName =
      effectiveName ||
      (user && user.name && !user.name.startsWith("Player") && user.name !== "Chess Player" ? user.name : null) ||
      (email ? email.split("@")[0] : `Player ${user?.id || 1}`);

    user.name = resolvedName;

    // Always ensure user profile is saved to userStore
    if (user) {
      userStore.upsertUser({
        id: user.id,
        name: resolvedName,
        email: user.email || email,
        avatarUrl: user.avatarUrl || effectiveAvatar,
        role: user.role || "STUDENT",
        rating: user.rating || 1200,
        onboardingDone: true,
      });
    }

    // 5. Generate ChessOne JWT
    const token = generateToken(user);

    return {
      token,
      user: {
        id: parseInt(user.id, 10),
        name: resolvedName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        rating: user.rating,
        onboardingDone: user.onboardingDone ?? true,
      },
    };
  }

  /**
   * Get user profile by database ID
   */
  async getUserById(userId) {
    const numericId = parseInt(userId, 10);
    try {
      const user = await prisma.user.findUnique({
        where: { id: numericId },
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          role: true,
          rating: true,
          onboardingDone: true,
          createdAt: true,
        },
      });

      if (user) {
        userStore.upsertUser(user);
        return {
          ...user,
          id: parseInt(user.id, 10),
        };
      }
    } catch (dbErr) {
      // DB failed, fallback to memory
    }

    const stored = userStore.getUser(numericId);
    if (stored) {
      return {
        ...stored,
        id: numericId,
      };
    }

    throw new AppError("USER_NOT_FOUND", "Authenticated user not found", 404);
  }
}

module.exports = new AuthService();
