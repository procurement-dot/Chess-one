const classService = require("../services/class.service");

class ClassController {
  /**
   * 1. POST /api/classes
   */
  async createClass(req, res, next) {
    try {
      const result = await classService.createClass({
        userId: req.user.id,
        data: req.validatedBody,
      });

      return res.status(201).json({
        success: true,
        data: {
          class: result,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 2. GET /api/classes?role&status
   */
  async listClasses(req, res, next) {
    try {
      const classes = await classService.listClasses({
        userId: req.user.id,
        userRole: req.user.role,
        query: req.validatedQuery || req.query || {},
      });

      return res.status(200).json({
        success: true,
        data: {
          classes,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 3. GET /api/classes/:classId
   */
  async getClass(req, res, next) {
    try {
      const cls = await classService.getClassById({
        classId: req.classId,
        userId: req.user.id,
        userRole: req.user.role,
      });

      return res.status(200).json({
        success: true,
        data: {
          class: cls,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 4. PATCH /api/classes/:classId
   */
  async updateClass(req, res, next) {
    try {
      const cls = await classService.updateClass({
        classId: req.classId,
        data: req.validatedBody,
        userId: req.user.id,
        userRole: req.user.role,
      });

      return res.status(200).json({
        success: true,
        data: {
          class: cls,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 5. POST /api/classes/:classId/archive
   */
  async archiveClass(req, res, next) {
    try {
      const result = await classService.archiveClass({
        classId: req.classId,
        userRole: req.user.role,
        callerMemberRole: req.classMember?.role,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 6. POST /api/classes/:classId/join-code/regenerate
   */
  async regenerateJoinCode(req, res, next) {
    try {
      const result = await classService.regenerateJoinCode({
        classId: req.classId,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 7. POST /api/classes/join
   */
  async joinClass(req, res, next) {
    try {
      const io = req.app.get("io");
      const { joinCode } = req.validatedBody;
      const cls = await classService.joinClass({
        userId: req.user.id,
        joinCode,
        io,
      });

      return res.status(200).json({
        success: true,
        data: {
          class: cls,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 8. GET /api/classes/:classId/members?role
   */
  async listMembers(req, res, next) {
    try {
      const members = await classService.listMembers({
        classId: req.classId,
        userId: req.user.id,
        userRole: req.user.role,
        callerMemberRole: req.classMember?.role,
        queryRole: req.query?.role,
      });

      return res.status(200).json({
        success: true,
        data: {
          members,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 9. POST /api/classes/:classId/members
   */
  async addMember(req, res, next) {
    try {
      const member = await classService.addMember({
        classId: req.classId,
        data: req.validatedBody,
      });

      return res.status(201).json({
        success: true,
        data: {
          member,
        },
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 10. PATCH /api/classes/:classId/members/:userId
   */
  async updateMemberRole(req, res, next) {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      const { role } = req.validatedBody;

      const result = await classService.updateMemberRole({
        classId: req.classId,
        targetUserId,
        newRole: role,
        userRole: req.user.role,
        callerMemberRole: req.classMember?.role,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 11. DELETE /api/classes/:classId/members/:userId
   */
  async removeMember(req, res, next) {
    try {
      const targetUserId = parseInt(req.params.userId, 10);
      const result = await classService.removeMember({
        classId: req.classId,
        targetUserId,
        userRole: req.user.role,
        callerMemberRole: req.classMember?.role,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * 12. POST /api/classes/:classId/leave
   */
  async leaveClass(req, res, next) {
    try {
      const result = await classService.leaveClass({
        classId: req.classId,
        userId: req.user.id,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new ClassController();
