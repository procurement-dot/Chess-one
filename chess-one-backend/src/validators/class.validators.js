const { z } = require("zod");

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
  validate,
};
