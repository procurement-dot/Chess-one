const classService = require("../services/class.service");

class AdminController {
  /**
   * 13. PATCH /api/admin/users/:userId/role
   */
  async updateUserRole(req, res, next) {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      const { role } = req.validatedBody;

      const user = await classService.updateUserRoleByAdmin({
        adminUserId: req.user.id,
        targetUserId,
        newRole: role,
      });

      return res.status(200).json({
        success: true,
        data: {
          user,
        },
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AdminController();
