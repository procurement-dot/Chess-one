const prisma = require("../config/database");
const { generateUniqueJoinCode } = require("../utils/joinCode");
const { sanitizeUser } = require("../utils/user");

/**
 * Format Class into standardized ClassDTO
 */
function toClassDTO(cls, { myRole = null, memberCount = 0, includeJoinCode = false } = {}) {
  const dto = {
    id: cls.id,
    name: cls.name,
    description: cls.description || null,
    level: cls.level || null,
    status: cls.status,
    maxStudents: cls.maxStudents,
    timezone: cls.timezone || "Asia/Kolkata",
    createdAt: cls.createdAt,
    owner: cls.owner
      ? {
          id: cls.owner.id,
          name: cls.owner.name,
          avatarUrl: cls.owner.avatarUrl || null,
        }
      : null,
    memberCount,
    myRole,
    nextSession: null,
  };

  if (includeJoinCode) {
    dto.joinCode = cls.joinCode;
  }

  return dto;
}

/**
 * Format ClassMember into standardized MemberDTO
 * Email is PII and only included when includeEmail is true (coaches/admins)
 */
function toMemberDTO(member, includeEmail = false) {
  const dto = {
    userId: member.userId,
    name: member.user?.name || "Unknown",
    avatarUrl: member.user?.avatarUrl || null,
    role: member.role,
    joinedAt: member.joinedAt,
  };

  if (includeEmail && member.user?.email) {
    dto.email = member.user.email;
  }

  return dto;
}

class ClassService {
  /**
   * 1. Create a new class (Coach/Admin only)
   * In ONE transaction: creates Class with unique joinCode and ClassMember(OWNER)
   */
  async createClass({ userId, data }) {
    const result = await prisma.$transaction(async (tx) => {
      const joinCode = await generateUniqueJoinCode(tx);

      const newClass = await tx.class.create({
        data: {
          name: data.name,
          description: data.description || null,
          level: data.level || null,
          maxStudents: data.maxStudents,
          timezone: data.timezone || "Asia/Kolkata",
          joinCode,
          ownerId: userId,
          status: "ACTIVE",
        },
        include: {
          owner: {
            select: { id: true, name: true, avatarUrl: true },
          },
        },
      });

      await tx.classMember.create({
        data: {
          classId: newClass.id,
          userId,
          role: "OWNER",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
      });

      return newClass;
    });

    return toClassDTO(result, {
      myRole: "OWNER",
      memberCount: 0,
      includeJoinCode: true,
    });
  }

  /**
   * 2. List classes where user is an active member
   */
  async listClasses({ userId, userRole, query }) {
    const memberRoleFilter =
      query.role === "coach"
        ? { in: ["OWNER", "COACH"] }
        : query.role === "student"
        ? "STUDENT"
        : undefined;

    const memberships = await prisma.classMember.findMany({
      where: {
        userId,
        status: "ACTIVE",
        ...(memberRoleFilter ? { role: memberRoleFilter } : {}),
        class: {
          status: query.status || "ACTIVE",
        },
      },
      include: {
        class: {
          include: {
            owner: {
              select: { id: true, name: true, avatarUrl: true },
            },
            members: {
              where: {
                status: "ACTIVE",
                role: "STUDENT",
              },
              select: { id: true },
            },
          },
        },
      },
      orderBy: {
        joinedAt: "desc",
      },
    });

    return memberships.map((m) => {
      const isCoachOrAdmin =
        m.role === "OWNER" || m.role === "COACH" || userRole === "ADMIN";
      return toClassDTO(m.class, {
        myRole: m.role,
        memberCount: m.class.members.length,
        includeJoinCode: isCoachOrAdmin,
      });
    });
  }

  /**
   * 3. Get single class details
   */
  async getClassById({ classId, userId, userRole }) {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        owner: {
          select: { id: true, name: true, avatarUrl: true },
        },
        members: {
          where: { status: "ACTIVE" },
          select: { userId: true, role: true },
        },
      },
    });

    if (!cls) {
      const err = new Error("Class not found");
      err.statusCode = 404;
      err.code = "CLASS_NOT_FOUND";
      throw err;
    }

    const myMember = cls.members.find((m) => m.userId === userId);
    const myRole = myMember ? myMember.role : (userRole === "ADMIN" ? "ADMIN" : null);
    const memberCount = cls.members.filter((m) => m.role === "STUDENT").length;
    const includeJoinCode =
      myRole === "OWNER" || myRole === "COACH" || userRole === "ADMIN";

    return toClassDTO(cls, {
      myRole,
      memberCount,
      includeJoinCode,
    });
  }

  /**
   * 4. Update class details (Coach/Owner/Admin only)
   */
  async updateClass({ classId, data, userId, userRole }) {
    const cls = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, status: true },
    });

    if (!cls) {
      const err = new Error("Class not found");
      err.statusCode = 404;
      err.code = "CLASS_NOT_FOUND";
      throw err;
    }

    if (cls.status === "ARCHIVED") {
      const err = new Error("Cannot update an archived class");
      err.statusCode = 400;
      err.code = "CLASS_ARCHIVED";
      throw err;
    }

    const updated = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(data.name ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.level !== undefined ? { level: data.level } : {}),
        ...(data.maxStudents !== undefined ? { maxStudents: data.maxStudents } : {}),
        ...(data.timezone ? { timezone: data.timezone } : {}),
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: { where: { status: "ACTIVE" }, select: { userId: true, role: true } },
      },
    });

    const myMember = updated.members.find((m) => m.userId === userId);
    const myRole = myMember ? myMember.role : (userRole === "ADMIN" ? "ADMIN" : null);
    const memberCount = updated.members.filter((m) => m.role === "STUDENT").length;

    return toClassDTO(updated, {
      myRole,
      memberCount,
      includeJoinCode: true,
    });
  }

  /**
   * 5. Archive class (Only OWNER or ADMIN)
   */
  async archiveClass({ classId, userRole, callerMemberRole }) {
    if (userRole !== "ADMIN" && callerMemberRole !== "OWNER") {
      const err = new Error("Only the class owner or an admin can archive the class");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    await prisma.class.update({
      where: { id: classId },
      data: { status: "ARCHIVED" },
    });

    return { message: "Class archived successfully" };
  }

  /**
   * 6. Regenerate join code (Coach/Owner/Admin only)
   */
  async regenerateJoinCode({ classId }) {
    const newCode = await generateUniqueJoinCode(prisma);

    await prisma.class.update({
      where: { id: classId },
      data: { joinCode: newCode },
    });

    return { joinCode: newCode };
  }

  /**
   * 7. Join class with joinCode
   */
  async joinClass({ userId, joinCode, io }) {
    const cls = await prisma.class.findUnique({
      where: { joinCode: joinCode.trim().toUpperCase() },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: { where: { status: "ACTIVE" }, select: { userId: true, role: true } },
      },
    });

    if (!cls) {
      const err = new Error("Class not found. Check the code.");
      err.statusCode = 404;
      err.code = "CLASS_NOT_FOUND";
      throw err;
    }

    if (cls.status === "ARCHIVED") {
      const err = new Error("This class is no longer active.");
      err.statusCode = 400;
      err.code = "CLASS_ARCHIVED";
      throw err;
    }

    const existingMember = await prisma.classMember.findFirst({
      where: { classId: cls.id, userId },
    });

    if (existingMember && existingMember.status === "ACTIVE") {
      const err = new Error("You are already in this class.");
      err.statusCode = 409;
      err.code = "ALREADY_MEMBER";
      throw err;
    }

    const activeStudentCount = cls.members.filter((m) => m.role === "STUDENT").length;
    if (activeStudentCount >= cls.maxStudents) {
      const err = new Error("This class is full.");
      err.statusCode = 409;
      err.code = "CLASS_FULL";
      throw err;
    }

    let member;
    if (existingMember) {
      member = await prisma.classMember.update({
        where: { id: existingMember.id },
        data: {
          status: "ACTIVE",
          role: "STUDENT",
          joinedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    } else {
      member = await prisma.classMember.create({
        data: {
          classId: cls.id,
          userId,
          role: "STUDENT",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    }

    // Optional socket broadcast to class room
    if (io) {
      try {
        io.to(`class:${cls.id}`).emit("class:member-joined", {
          classId: cls.id,
          member: toMemberDTO(member, false),
        });
      } catch (e) {
        // Safe ignore
      }
    }

    return toClassDTO(cls, {
      myRole: "STUDENT",
      memberCount: activeStudentCount + 1,
      includeJoinCode: false,
    });
  }

  /**
   * 8. List members of a class
   * Sorted: OWNER first, then COACH, then STUDENT (alphabetically)
   * Email is included ONLY when viewer is coach or admin
   */
  async listMembers({ classId, userRole, callerMemberRole, queryRole }) {
    const isCoachOrAdmin =
      userRole === "ADMIN" ||
      callerMemberRole === "OWNER" ||
      callerMemberRole === "COACH";

    const members = await prisma.classMember.findMany({
      where: {
        classId,
        status: "ACTIVE",
        ...(queryRole ? { role: queryRole.toUpperCase() } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, email: true },
        },
      },
    });

    const rolePriority = { OWNER: 1, COACH: 2, STUDENT: 3 };
    members.sort((a, b) => {
      const prioA = rolePriority[a.role] || 99;
      const prioB = rolePriority[b.role] || 99;
      if (prioA !== prioB) return prioA - prioB;
      return (a.user.name || "").localeCompare(b.user.name || "");
    });

    return members.map((m) => toMemberDTO(m, isCoachOrAdmin));
  }

  /**
   * 9. Add member to class by coach/admin
   */
  async addMember({ classId, data }) {
    let targetUser;
    if (data.email) {
      targetUser = await prisma.user.findUnique({
        where: { email: data.email.toLowerCase().trim() },
      });
    } else if (data.userId) {
      targetUser = await prisma.user.findUnique({
        where: { id: data.userId },
      });
    }

    if (!targetUser) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const cls = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        members: { where: { status: "ACTIVE" } },
      },
    });

    if (!cls) {
      const err = new Error("Class not found");
      err.statusCode = 404;
      err.code = "CLASS_NOT_FOUND";
      throw err;
    }

    if (cls.status === "ARCHIVED") {
      const err = new Error("This class is no longer active.");
      err.statusCode = 400;
      err.code = "CLASS_ARCHIVED";
      throw err;
    }

    const existingMember = await prisma.classMember.findFirst({
      where: { classId, userId: targetUser.id },
    });

    if (existingMember && existingMember.status === "ACTIVE") {
      const err = new Error("User is already in this class.");
      err.statusCode = 409;
      err.code = "ALREADY_MEMBER";
      throw err;
    }

    const activeStudentCount = cls.members.filter((m) => m.role === "STUDENT").length;
    if (activeStudentCount >= cls.maxStudents) {
      const err = new Error("This class is full.");
      err.statusCode = 409;
      err.code = "CLASS_FULL";
      throw err;
    }

    let member;
    if (existingMember) {
      member = await prisma.classMember.update({
        where: { id: existingMember.id },
        data: {
          status: "ACTIVE",
          role: "STUDENT",
          joinedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    } else {
      member = await prisma.classMember.create({
        data: {
          classId,
          userId: targetUser.id,
          role: "STUDENT",
          status: "ACTIVE",
          joinedAt: new Date(),
        },
        include: {
          user: { select: { id: true, name: true, avatarUrl: true, email: true } },
        },
      });
    }

    return toMemberDTO(member, true);
  }

  /**
   * 10. Update member role (Owner/Admin only)
   * The OWNER's role cannot be changed -> 400 VALIDATION_ERROR
   */
  async updateMemberRole({ classId, targetUserId, newRole, userRole, callerMemberRole }) {
    if (userRole !== "ADMIN" && callerMemberRole !== "OWNER") {
      const err = new Error("Only the class owner or an admin can update member roles");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    const targetMember = await prisma.classMember.findFirst({
      where: { classId, userId: targetUserId, status: "ACTIVE" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });

    if (!targetMember) {
      const err = new Error("Member not found in this class");
      err.statusCode = 404;
      err.code = "NOT_A_CLASS_MEMBER";
      throw err;
    }

    if (targetMember.role === "OWNER") {
      const err = new Error("Cannot change the owner's role");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    const updated = await prisma.classMember.update({
      where: { id: targetMember.id },
      data: { role: newRole },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true, email: true } },
      },
    });

    return toMemberDTO(updated, true);
  }

  /**
   * 11. Remove member (Coach/Owner/Admin)
   * - OWNER cannot be removed (400)
   * - A COACH cannot remove another COACH (only OWNER or ADMIN can)
   */
  async removeMember({ classId, targetUserId, userRole, callerMemberRole }) {
    const targetMember = await prisma.classMember.findFirst({
      where: { classId, userId: targetUserId, status: "ACTIVE" },
    });

    if (!targetMember) {
      const err = new Error("Member not found in this class");
      err.statusCode = 404;
      err.code = "NOT_A_CLASS_MEMBER";
      throw err;
    }

    if (targetMember.role === "OWNER") {
      const err = new Error("The class owner cannot be removed");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    if (
      targetMember.role === "COACH" &&
      userRole !== "ADMIN" &&
      callerMemberRole !== "OWNER"
    ) {
      const err = new Error("Only the class owner or an admin can remove a coach");
      err.statusCode = 403;
      err.code = "FORBIDDEN";
      throw err;
    }

    await prisma.classMember.update({
      where: { id: targetMember.id },
      data: { status: "REMOVED" },
    });

    return { message: "Member removed successfully" };
  }

  /**
   * 12. Leave class
   * - The OWNER cannot leave (400)
   */
  async leaveClass({ classId, userId }) {
    const member = await prisma.classMember.findFirst({
      where: { classId, userId, status: "ACTIVE" },
    });

    if (!member) {
      const err = new Error("You are not an active member of this class");
      err.statusCode = 403;
      err.code = "NOT_A_CLASS_MEMBER";
      throw err;
    }

    if (member.role === "OWNER") {
      const err = new Error("The class owner cannot leave the class");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    await prisma.classMember.update({
      where: { id: member.id },
      data: { status: "LEFT" },
    });

    return { message: "Left class successfully" };
  }

  /**
   * 13. Admin updates user role
   * - An admin cannot remove their own ADMIN role (400)
   */
  async updateUserRoleByAdmin({ adminUserId, targetUserId, newRole }) {
    if (adminUserId === targetUserId && newRole !== "ADMIN") {
      const err = new Error("An admin cannot remove their own ADMIN role");
      err.statusCode = 400;
      err.code = "VALIDATION_ERROR";
      throw err;
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      const err = new Error("User not found");
      err.statusCode = 404;
      err.code = "USER_NOT_FOUND";
      throw err;
    }

    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    return sanitizeUser(updated);
  }
}

module.exports = new ClassService();
module.exports.toClassDTO = toClassDTO;
module.exports.toMemberDTO = toMemberDTO;
