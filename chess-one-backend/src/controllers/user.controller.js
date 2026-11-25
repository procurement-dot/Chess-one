const prisma = require("../config/database");
const { getOnlineUserIds, isUserOnline, getUserSocketCount } = require("../config/socket");
const { success } = require("../utils/response");
const userService = require("../services/user.service");
const userStore = require("../store/user.store");

class UserController {
  async getMe(req, res, next) {
    try {
      const user = await userService.getProfile(req.user.id);
      return success(res, { user });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req, res, next) {
    try {
      const user = await userService.updateProfile(req.user.id, req.validatedBody);
      return success(res, { user });
    } catch (err) {
      next(err);
    }
  }

  async getPresence(req, res, next) {
    try {
      const userId = parseInt(req.user?.id, 10);
      return success(res, {
        me: {
          id: userId,
          isOnline: isUserOnline(userId),
          socketCount: getUserSocketCount(userId),
        },
        onlineUserIds: getOnlineUserIds(),
      });
    } catch (err) {
      next(err);
    }
  }

  async getUsers(req, res, next) {
    try {
      const currentUserId = req.user?.id ? parseInt(req.user.id, 10) : null;
      const allKnownUsers = new Map();

      // 1. Add all active users currently tracked in memory (e.g. connected via socket)
      const storeUsers = userStore.getAllUsers();
      for (const u of storeUsers) {
        if (u && u.id) {
          const numId = parseInt(u.id, 10);
          allKnownUsers.set(numId, {
            id: numId,
            name: u.name || `Player ${numId}`,
            avatarUrl: u.avatarUrl || null,
            role: u.role || "STUDENT",
            rating: u.rating || 1200,
          });
        }
      }

      // 2. Fetch users from persistent database
      try {
        const dbUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            rating: true,
          },
          orderBy: { name: "asc" },
        });

        for (const u of dbUsers) {
          allKnownUsers.set(u.id, {
            id: u.id,
            name: u.name,
            avatarUrl: u.avatarUrl || null,
            role: u.role || "STUDENT",
            rating: u.rating || 1200,
          });
        }
      } catch (dbErr) {
        console.warn("[UserController] Database query failed or paused. Falling back to active users:", dbErr.message);
        if (allKnownUsers.size === 0) {
          return res.status(503).json({
            success: false,
            error: {
              code: "DATABASE_UNAVAILABLE",
              message: "Database connection unavailable. If using Supabase, please ensure your project is restored and active in the Supabase Dashboard.",
            },
          });
        }
      }

      const formatted = Array.from(allKnownUsers.values()).map((u) => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl || null,
        role: u.role || "STUDENT",
        rating: u.rating || 1200,
        isOnline: isUserOnline(u.id),
        isMe: currentUserId === u.id,
      }));

      // Sort: online users first, then by name ascending
      formatted.sort((a, b) => {
        if (a.isOnline !== b.isOnline) return a.isOnline ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "");
      });

      const onlineCount = formatted.filter((u) => u.isOnline).length;
      const isOnlineOnlyQuery = req.path === "/online" || req.query.online === "true";
      const resultUsers = isOnlineOnlyQuery ? formatted.filter((u) => u.isOnline) : formatted;

      return success(res, {
        users: resultUsers,
        total: resultUsers.length,
        onlineCount,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
