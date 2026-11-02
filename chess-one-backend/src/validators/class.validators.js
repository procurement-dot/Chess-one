const { z } = require("zod");

const env = require("../config/env");

const idParam = z.coerce
  .number({ invalid_type_error: "ID must be a number" })
  .int("ID must be an integer")
  .positive("ID must be a positive integer");

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1, "Page must be >= 1").default(1),
  limit: z.coerce.number().int().min(1, "Limit must be >= 1").max(50, "Limit cannot exceed 50").default(20),
});

const joinCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-HJ-NP-Z2-9]{6}$/,
    "Join code must be exactly 6 alphanumeric characters (excluding ambiguous characters 0, O, 1, I)"
  );

const createClassSchema = z.object({
  name: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(3, "Name must be between 3 and 80 characters")
    .max(80, "Name must be between 3 and 80 characters"),
  description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
  level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional().nullable(),
  maxStudents: z.coerce
    .number()
    .int("maxStudents must be an integer")
    .min(1, "maxStudents must be between 1 and 200")
    .max(200, "maxStudents must be between 1 and 200")
    .default(env.CLASS_MAX_STUDENTS_DEFAULT || 30),
  timezone: z.string().trim().default("Asia/Kolkata"),
});

const updateClassSchema = z
  .object({
    name: z.string().trim().min(3, "Name must be between 3 and 80 characters").max(80, "Name must be between 3 and 80 characters").optional(),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").optional().nullable(),
    level: z.enum(["Beginner", "Intermediate", "Advanced"]).optional().nullable(),
    maxStudents: z.coerce.number().int().min(1, "maxStudents must be between 1 and 200").max(200, "maxStudents must be between 1 and 200").optional(),
    timezone: z.string().trim().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required to update",
  });

const joinClassSchema = z.object({
  joinCode: joinCodeSchema,
});

const addMemberSchema = z
  .object({
    email: z.string().email("Invalid email address").optional(),
    userId: z.coerce.number().int().positive("Invalid userId").optional(),
  })
  .refine((data) => (data.email !== undefined) !== (data.userId !== undefined), {
    message: "Provide either email or userId, but not both",
  });

const updateMemberRoleSchema = z.object({
  role: z.enum(["COACH", "STUDENT"]),
});

const listClassesQuery = z.object({
  role: z.enum(["coach", "student"]).optional(),
  status: z.enum(["ACTIVE", "ARCHIVED"]).default("ACTIVE"),
});

const adminRoleSchema = z.object({
  role: z.enum(["PLAYER", "COACH", "ADMIN"]),
});

/**
 * Reusable validation middleware supporting body, params, and query
 * @param {z.ZodSchema} schema 
 * @param {"body"|"params"|"query"} source 
 */
function validate(schema, source = "body") {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source] || {};
      const parsed = schema.parse(dataToValidate);
      if (source === "body") req.validatedBody = parsed;
      else if (source === "params") req.validatedParams = parsed;
      else if (source === "query") req.validatedQuery = parsed;
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  idParam,
  paginationSchema,
  joinCodeSchema,
  createClassSchema,
  updateClassSchema,
  joinClassSchema,
  addMemberSchema,
  updateMemberRoleSchema,
  listClassesQuery,
  adminRoleSchema,
  validate,
};
