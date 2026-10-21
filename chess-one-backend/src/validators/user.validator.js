const { z } = require("zod");

const PRIVILEGED_ROLES = ["COACH", "SCHOOL", "ORGANISER", "ADMIN"];

const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    role: z.enum(["STUDENT", "PARENT"]).optional(), // users may only self-select these two
    school: z.string().trim().max(120).optional().nullable(),
    schoolClass: z.string().trim().max(40).optional().nullable(),
    level: z.enum(["Beginner", "Developing", "Advanced"]).optional().nullable(),
    fideId: z
      .string()
      .trim()
      .regex(/^\d{4,10}$/)
      .optional()
      .nullable()
      .or(z.literal("")),
    parentName: z.string().trim().max(80).optional().nullable(),
    parentEmail: z
      .string()
      .trim()
      .email()
      .optional()
      .nullable()
      .or(z.literal("")),
  })
  .strict();

/**
 * Security guard: reject self-selection of privileged roles with 403 before Zod runs
 */
function blockPrivilegedRole(req, res, next) {
  if (req.body && req.body.role && PRIVILEGED_ROLES.includes(req.body.role)) {
    return res.status(403).json({
      success: false,
      error: {
        code: "ROLE_NOT_ALLOWED",
        message: "You cannot choose this role",
      },
    });
  }
  next();
}

/**
 * Validate request body against schema and turn empty strings into null
 */
function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req.body || {});
      const normalized = {};
      for (const [key, value] of Object.entries(parsed)) {
        normalized[key] = value === "" ? null : value;
      }
      req.validatedBody = normalized;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  updateProfileSchema,
  blockPrivilegedRole,
  validate,
};
