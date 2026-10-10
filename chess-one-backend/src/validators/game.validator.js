const { z } = require("zod");

const createGameSchema = z.object({
  gameType: z.enum(["PLAYER_VS_PLAYER", "PLAYER_VS_AI"], {
    errorMap: () => ({ message: "gameType must be either PLAYER_VS_PLAYER or PLAYER_VS_AI" }),
  }),
  timeControl: z
    .string()
    .regex(/^\d+\+\d+$/, "Time control must be in format <minutes>+<increment>, e.g., 10+0, 3+2"),
  colorPreference: z.enum(["WHITE", "BLACK", "RANDOM"]).optional().default("RANDOM"),
  aiDifficulty: z.enum(["EASY", "MEDIUM", "HARD"]).optional().default("MEDIUM"),
});

const makeMoveSchema = z.object({
  from: z
    .string()
    .min(2)
    .max(2)
    .regex(/^[a-h][1-8]$/, "from square must be a valid chess square (e.g. e2)"),
  to: z
    .string()
    .min(2)
    .max(2)
    .regex(/^[a-h][1-8]$/, "to square must be a valid chess square (e.g. e4)"),
  promotion: z.enum(["q", "r", "b", "n"]).optional(),
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
  createGameSchema,
  makeMoveSchema,
  validate,
};
