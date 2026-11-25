const prisma = require("../config/database");
const { getOnlineUserIds, isUserOnline } = require("../config/socket");
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

  async getUsers(req, res, next) {
    try {
      const currentUserId = req.user?.id ? parseInt(req.user.id, 10) : null;

      let dbUsers;
      try {
        dbUsers = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            role: true,
            rating: true,
          },
          orderBy: { name: "asc" },
        });
      } catch (dbErr) {
        return res.status(503).json({
          success: false,
          error: {
            code: "DATABASE_UNAVAILABLE",
            message: "Database connection unavailable. If using Supabase, please ensure your project is restored and active in the Supabase Dashboard.",
          },
        });
      }

      const formatted = dbUsers.map((u) => ({
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
