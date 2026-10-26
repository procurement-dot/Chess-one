const { z } = require("zod");
const { AppError } = require("../middleware/error.middleware");

// Time control validator reusing the exact same format as games
const timeControlSchema = z
  .string()
  .regex(/^\d+\+\d+$/, "Time control must be in format <minutes>+<increment>, e.g., 10+0, 3+2");

const createTournamentSchema = z
  .object({
    name: z.string().trim().min(3).max(80),
    description: z.string().trim().max(500).optional().nullable(),
    format: z.enum(["ROUND_ROBIN", "SWISS"]).default("ROUND_ROBIN"),
    timeControl: timeControlSchema,
    maxPlayers: z.number().int().min(2).max(128),
    startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), "Start time must be in the future"),
    isRated: z.boolean().optional().default(true),
  })
  .strict();

const updateTournamentSchema = z
  .object({
    name: z.string().trim().min(3).max(80).optional(),
    description: z.string().trim().max(500).optional().nullable(),
    format: z.enum(["ROUND_ROBIN", "SWISS"]).optional(),
    timeControl: timeControlSchema.optional(),
    maxPlayers: z.number().int().min(1).max(128).optional(),
    startsAt: z.coerce
      .date()
      .refine((d) => d.getTime() > Date.now(), "Start time must be in the future")
      .optional(),
    isRated: z.boolean().optional(),
  })
  .strict();

const listTournamentsQuery = z.object({
  status: z.enum(["UPCOMING", "ACTIVE", "COMPLETED", "CANCELLED"]).optional(),
  mine: z.enum(["true", "false"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
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

function validateQuery(schema) {
  return (req, res, next) => {
    try {
      req.validatedQuery = schema.parse(req.query);
      next();
    } catch (err) {
      next(err);
    }
  };
}

function checkId(req, res, next) {
  const rawId = req.params.id;
  const id = parseInt(rawId, 10);
  if (!/^\d+$/.test(rawId) || Number.isNaN(id) || id <= 0) {
    return next(new AppError("INVALID_ID", "Tournament ID must be a positive integer", 400));
  }
  req.tournamentId = id;
  next();
}

module.exports = {
  createTournamentSchema,
  updateTournamentSchema,
  listTournamentsQuery,
  validate,
  validateQuery,
  checkId,
};
