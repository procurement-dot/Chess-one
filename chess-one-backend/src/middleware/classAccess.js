const prisma = require("../config/database");

/**
 * Resolve classId from various param keys (classId, sessionId, lessonId, assignmentId, positionId, submissionId)
 */
async function resolveClassId(req, res, next) {
  try {
    const params = req.params || {};

    let targetParam = null;
    let paramType = null;

    if (params.classId !== undefined) {
      targetParam = params.classId;
      paramType = "classId";
    } else if (params.sessionId !== undefined) {
      targetParam = params.sessionId;
      paramType = "sessionId";
    } else if (params.lessonId !== undefined) {
      targetParam = params.lessonId;
      paramType = "lessonId";
    } else if (params.assignmentId !== undefined) {
      targetParam = params.assignmentId;
      paramType = "assignmentId";
    } else if (params.positionId !== undefined) {
      targetParam = params.positionId;
      paramType = "positionId";
    } else if (params.submissionId !== undefined) {
      targetParam = params.submissionId;
      paramType = "submissionId";
    } else {
      return next();
    }

    const idNum = parseInt(targetParam, 10);
    if (isNaN(idNum) || idNum <= 0 || String(idNum) !== String(targetParam).trim()) {
      return res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: `Invalid ${paramType}: must be a positive integer`,
          details: [{ field: paramType, message: "Expected positive integer" }],
        },
      });
    }

    let classId = null;

    if (paramType === "classId") {
      const cls = await prisma.class.findUnique({
        where: { id: idNum },
        select: { id: true },
      });
      if (!cls) {
        return res.status(404).json({
          success: false,
          error: { code: "CLASS_NOT_FOUND", message: "Class not found" },
        });
      }
      classId = cls.id;
    } else if (paramType === "sessionId") {
      const session = await prisma.classSession.findUnique({
        where: { id: idNum },
        select: { classId: true },
      });
      if (!session) {
        return res.status(404).json({
          success: false,
          error: { code: "SESSION_NOT_FOUND", message: "Class session not found" },
        });
      }
      classId = session.classId;
    } else if (paramType === "lessonId") {
      const lesson = await prisma.lesson.findUnique({
        where: { id: idNum },
        select: { classId: true },
      });
      if (!lesson) {
        return res.status(404).json({
          success: false,
          error: { code: "LESSON_NOT_FOUND", message: "Lesson not found" },
        });
      }
      classId = lesson.classId;
    } else if (paramType === "assignmentId") {
      const assignment = await prisma.assignment.findUnique({
        where: { id: idNum },
        select: { classId: true },
      });
      if (!assignment) {
        return res.status(404).json({
          success: false,
          error: { code: "ASSIGNMENT_NOT_FOUND", message: "Assignment not found" },
        });
      }
      classId = assignment.classId;
    } else if (paramType === "positionId") {
      const pos = await prisma.lessonPosition.findUnique({
        where: { id: idNum },
        select: { lesson: { select: { classId: true } } },
      });
      if (!pos || !pos.lesson) {
        return res.status(404).json({
          success: false,
          error: { code: "LESSON_NOT_FOUND", message: "Lesson position not found" },
        });
      }
      classId = pos.lesson.classId;
    } else if (paramType === "submissionId") {
      const sub = await prisma.submission.findUnique({
        where: { id: idNum },
        select: { assignment: { select: { classId: true } } },
      });
      if (!sub || !sub.assignment) {
        return res.status(404).json({
          success: false,
          error: { code: "ASSIGNMENT_NOT_FOUND", message: "Submission not found" },
        });
      }
      classId = sub.assignment.classId;
    }

    req.classId = classId;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require active class membership (ADMIN passes)
 */
async function requireClassMember(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (req.user.role === "ADMIN") {
      return next();
    }

    const classId = req.classId;
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Class context required" },
      });
    }

    const member = await prisma.classMember.findFirst({
      where: {
        classId: parseInt(classId, 10),
        userId: parseInt(req.user.id, 10),
        status: "ACTIVE",
      },
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NOT_A_CLASS_MEMBER",
          message: "You are not an active member of this class",
        },
      });
    }

    req.classMember = member;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Require coach or owner role in class (ADMIN passes)
 */
async function requireClassCoach(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Authentication required" },
      });
    }

    if (req.user.role === "ADMIN") {
      return next();
    }

    const classId = req.classId;
    if (!classId) {
      return res.status(400).json({
        success: false,
        error: { code: "VALIDATION_ERROR", message: "Class context required" },
      });
    }

    const coachMember = await prisma.classMember.findFirst({
      where: {
        classId: parseInt(classId, 10),
        userId: parseInt(req.user.id, 10),
        status: "ACTIVE",
        role: { in: ["OWNER", "COACH"] },
      },
    });

    if (!coachMember) {
      return res.status(403).json({
        success: false,
        error: {
          code: "NOT_CLASS_COACH",
          message: "You are not a coach of this class",
        },
      });
    }

    req.classMember = coachMember;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = {
  resolveClassId,
  requireClassMember,
  requireClassCoach,
};
