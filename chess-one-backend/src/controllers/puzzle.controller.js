const prisma = require("../config/prisma");

// Rating boundaries for the 5 Mastery Tiers
const TIER_RANGES = {
  Foundation: { min: 600, max: 800 },
  'Pre-Intermediate': { min: 801, max: 1100 },
  Intermediate: { min: 1101, max: 1400 },
  'Pre-Advance': { min: 1401, max: 1700 },
  Advance: { min: 1701, max: 2800 },
};

/**
 * GET /api/puzzles
 * Fetches puzzles from 32,241 dataset with tier/rating/theme filtering
 */
exports.getPuzzles = async (req, res, next) => {
  try {
    const {
      tier,
      theme,
      minRating,
      maxRating,
      limit = 15,
      page = 1,
      random = false,
    } = req.query;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 15, 1), 50);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Determine rating filters
    let ratingMin = minRating ? parseInt(minRating, 10) : undefined;
    let ratingMax = maxRating ? parseInt(maxRating, 10) : undefined;

    if (tier && TIER_RANGES[tier]) {
      ratingMin = ratingMin !== undefined ? ratingMin : TIER_RANGES[tier].min;
      ratingMax = ratingMax !== undefined ? ratingMax : TIER_RANGES[tier].max;
    }

    const where = {};
    if (ratingMin !== undefined || ratingMax !== undefined) {
      where.rating = {};
      if (ratingMin !== undefined) where.rating.gte = ratingMin;
      if (ratingMax !== undefined) where.rating.lte = ratingMax;
    }

    if (theme) {
      where.themes = { contains: theme, mode: 'insensitive' };
    }

    const totalCount = await prisma.puzzle.count({ where });

    let puzzles;
    if (random === 'true' || random === true) {
      // Pick random offset if many rows match
      const maxOffset = Math.max(totalCount - parsedLimit, 0);
      const randomSkip = Math.floor(Math.random() * (maxOffset + 1));
      puzzles = await prisma.puzzle.findMany({
        where,
        take: parsedLimit,
        skip: randomSkip,
      });
    } else {
      puzzles = await prisma.puzzle.findMany({
        where,
        take: parsedLimit,
        skip,
        orderBy: { rating: 'asc' },
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        page: parsedPage,
        limit: parsedLimit,
        puzzles,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/puzzles/daily
 * Deterministic daily puzzle for all users based on date
 */
exports.getDailyPuzzle = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    // Simple hash of date string to get an offset
    let hash = 0;
    for (let i = 0; i < todayStr.length; i++) {
      hash = (hash * 31 + todayStr.charCodeAt(i)) % 32241;
    }

    const puzzle = await prisma.puzzle.findFirst({
      skip: Math.abs(hash),
    });

    return res.status(200).json({
      success: true,
      data: {
        date: todayStr,
        puzzle,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/puzzles/:id
 */
exports.getPuzzleById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const puzzle = await prisma.puzzle.findUnique({
      where: { id },
    });

    if (!puzzle) {
      return res.status(404).json({
        success: false,
        error: { code: 'PUZZLE_NOT_FOUND', message: `Puzzle ${id} not found` },
      });
    }

    return res.status(200).json({
      success: true,
      data: puzzle,
    });
  } catch (error) {
    next(error);
  }
};
