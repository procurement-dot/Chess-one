const prisma = require("../config/database");
const { AppError } = require("../middleware/error.middleware");
const userStore = require("../store/user.store");

const PROFILE_SELECT = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
  role: true,
  rating: true,
  gamesPlayed: true,
  school: true,
  schoolClass: true,
  level: true,
  fideId: true,
  parentName: true,
  parentEmail: true,
  onboardingDone: true,
  createdAt: true,
};

const ALLOWED_FIELDS = [
  "name",
  "role",
  "school",
  "schoolClass",
  "level",
  "fideId",
  "parentName",
  "parentEmail",
];

class UserService {
  /**
   * Fetch user profile by ID
   */
  async getProfile(userId) {
    const id = parseInt(userId, 10);
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: PROFILE_SELECT,
      });

      if (user) {
        userStore.upsertUser(user);
        return user;
      }
    } catch (err) {
      if (err instanceof AppError) throw err;
    }

    const stored = userStore.getUser(id);
    if (stored) {
      return {
        id: stored.id,
        name: stored.name,
        email: stored.email,
        avatarUrl: stored.avatarUrl || null,
        role: stored.role || "STUDENT",
        rating: stored.rating || 1200,
        gamesPlayed: stored.gamesPlayed || 0,
        school: stored.school || "The Bishop's School",
        schoolClass: stored.schoolClass || "Grade 5",
        level: stored.level || 1,
        fideId: stored.fideId || null,
        parentName: stored.parentName || null,
        parentEmail: stored.parentEmail || null,
        onboardingDone: true,
        createdAt: stored.createdAt || new Date(),
      };
    }

    throw new AppError("USER_NOT_FOUND", "User not found", 404);
  }

  /**
   * Update allowed profile fields and mark onboardingDone = true
   */
  async updateProfile(userId, data = {}) {
    const id = parseInt(userId, 10);
    try {
      const existing = await prisma.user.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!existing) {
        throw new AppError("USER_NOT_FOUND", "User not found", 404);
      }

      const updateData = {
        onboardingDone: true,
      };

      for (const key of ALLOWED_FIELDS) {
        if (Object.prototype.hasOwnProperty.call(data, key) && data[key] !== undefined) {
          updateData[key] = data[key] === "" ? null : data[key];
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: PROFILE_SELECT,
      });

      return updatedUser;
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw err;
    }
  }
}

module.exports = new UserService();
module.exports.PROFILE_SELECT = PROFILE_SELECT;
