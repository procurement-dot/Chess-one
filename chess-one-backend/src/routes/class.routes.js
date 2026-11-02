const express = require("express");
const router = express.Router();
const classController = require("../controllers/class.controller");
const { authenticate } = require("../middleware/auth.middleware");
const { requireRole } = require("../middleware/requireRole");
const {
  resolveClassId,
  requireClassMember,
  requireClassCoach,
} = require("../middleware/classAccess");
const {
  validate,
  createClassSchema,
  updateClassSchema,
  joinClassSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  listClassesQuery,
} = require("../validators/class.validators");

// All class routes require authenticated user
router.use(authenticate);

// 1. Create a class (Coach/Admin only)
router.post(
  "/",
  requireRole("COACH", "ADMIN"),
  validate(createClassSchema),
  classController.createClass
);

// 2. List user's classes
router.get(
  "/",
  validate(listClassesQuery, "query"),
  classController.listClasses
);

// 7. Join class with code (Registered BEFORE /:classId so "join" is not captured as classId)
router.post(
  "/join",
  validate(joinClassSchema),
  classController.joinClass
);

// 3. Get single class details
router.get(
  "/:classId",
  resolveClassId,
  requireClassMember,
  classController.getClass
);

// 4. Update class details
router.patch(
  "/:classId",
  resolveClassId,
  requireClassCoach,
  validate(updateClassSchema),
  classController.updateClass
);

// 5. Archive class (Owner or Admin)
router.post(
  "/:classId/archive",
  resolveClassId,
  requireClassCoach,
  classController.archiveClass
);

// 6. Regenerate join code
router.post(
  "/:classId/join-code/regenerate",
  resolveClassId,
  requireClassCoach,
  classController.regenerateJoinCode
);

// 8. List class members
router.get(
  "/:classId/members",
  resolveClassId,
  requireClassMember,
  classController.listMembers
);

// 9. Add member directly
router.post(
  "/:classId/members",
  resolveClassId,
  requireClassCoach,
  validate(addMemberSchema),
  classController.addMember
);

// 10. Update member role (Owner/Admin)
router.patch(
  "/:classId/members/:userId",
  resolveClassId,
  requireClassCoach,
  validate(updateMemberRoleSchema),
  classController.updateMemberRole
);

// 11. Remove member (Coach/Owner/Admin)
router.delete(
  "/:classId/members/:userId",
  resolveClassId,
  requireClassCoach,
  classController.removeMember
);

// 12. Leave class
router.post(
  "/:classId/leave",
  resolveClassId,
  requireClassMember,
  classController.leaveClass
);

module.exports = router;
