const prisma = require("../config/database");
const { getOnlineUserIds, isUserOnline } = require("../config/socket");
const { success } = require("../utils/response");

class UserController {
  async getUsers(req, res, next) {
    try {
      const currentUserId = req.user?.id ? parseInt(req.user.id, 10) : null;
      const onlineIds = getOnlineUserIds();
      const onlineSet = new Set(onlineIds.map((id) => parseInt(id, 10)));

      // Fetch registered users (exclude current logged in user)
      const users = await prisma.user.findMany({
        where: currentUserId ? { id: { not: currentUserId } } : {},
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          createdAt: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      const formatted = users.map((u) => {
        const isOnline = onlineSet.has(u.id);
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          avatarUrl: u.avatarUrl,
          isOnline,
          createdAt: u.createdAt,
        };
      });

      // Sort: online users first, then alphabetically
      formatted.sort((a, b) => {
        if (a.isOnline === b.isOnline) {
          return a.name.localeCompare(b.name);
        }
        return a.isOnline ? -1 : 1;
      });

      // Only return users who are genuinely online right now (no static offline accounts)
      const onlineOnly = formatted.filter((u) => u.isOnline);

      return success(res, {
        users: onlineOnly,
        total: onlineOnly.length,
        onlineCount: onlineOnly.length,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();
