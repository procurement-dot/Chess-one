const { z } = require("zod");

const googleAuthSchema = z.object({
  idToken: z
    .string({ required_error: "idToken is required" })
    .min(1, "idToken cannot be empty"),
});

function validate(schema) {
  return (req, res, next) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = {
  googleAuthSchema,
  validate,
};
