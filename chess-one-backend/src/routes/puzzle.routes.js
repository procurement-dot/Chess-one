const express = require("express");
const router = express.Router();
const puzzleController = require("../controllers/puzzle.controller");

// Daily puzzle
router.get("/daily", puzzleController.getDailyPuzzle);

// Query puzzles with tier/theme/rating filters
router.get("/", puzzleController.getPuzzles);

// Get single puzzle by Lichess ID
router.get("/:id", puzzleController.getPuzzleById);

module.exports = router;
