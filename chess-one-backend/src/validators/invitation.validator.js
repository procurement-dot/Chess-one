const { z } = require("zod");

const createInvitationSchema = z.object({
  opponentUserId: z.coerce
    .number({
      invalid_type_error: "opponentUserId must be a valid integer ID",
    })
    .int("opponentUserId must be an integer")
    .positive("opponentUserId must be positive"),
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
  createInvitationSchema,
  validate,
};
