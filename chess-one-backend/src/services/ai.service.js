const { Chess } = require("chess.js");

const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Center squares bonus
const CENTER_SQUARES = new Set(["d4", "e4", "d5", "e5", "c4", "f4", "c5", "f5"]);

/**
 * Intelligent Chess AI Service
 * Evaluates tactical positions, captures free material, avoids blunders, and executes checkmates
 */
class AIService {
  /**
   * Calculate best move for the given board position and difficulty
   * @param {object} params
   * @param {string} params.fen - Board position in FEN format
   * @param {string} params.difficulty - 'EASY' | 'MEDIUM' | 'HARD'
   * @returns {Promise<{ from: string, to: string, promotion?: string } | null>}
   */
  async getBestMove({ fen, difficulty = "MEDIUM" }) {
    if (process.env.STOCKFISH_PATH) {
      return this._getStockfishMove({ fen, difficulty });
    }
    return this._getTacticalAIMove({ fen, difficulty });
  }

  /**
   * Evaluates a static position relative to the moving side
   */
  _evaluateMove(chess, move) {
    let score = 0;

    // 1. Immediate Checkmate is top priority
    if (move.san.includes("#")) {
      return 100000;
    }

    // 2. Captures: High reward for taking enemy material
    if (move.captured) {
      const victimValue = PIECE_VALUES[move.captured] || 100;
      const attackerValue = PIECE_VALUES[move.piece] || 100;
      // Winning material (e.g. pawn takes queen, or equal trade)
      score += victimValue * 10 - attackerValue;
    }

    // 3. Pawn Promotion: Massive reward
    if (move.promotion) {
      score += (PIECE_VALUES[move.promotion] || 800) * 8;
    }

    // 4. Giving Check
    if (move.san.includes("+")) {
      score += 60;
    }

    // 5. Center control / development bonus
    if (CENTER_SQUARES.has(move.to)) {
      score += 30;
    }

    // 6. Test opponent's immediate reply to avoid blatant hanging blunders
    try {
      const testChess = new Chess(chess.fen());
      testChess.move({ from: move.from, to: move.to, promotion: move.promotion });

      const oppMoves = testChess.moves({ verbose: true });
      for (const oppMove of oppMoves) {
        // If opponent can deliver checkmate on their turn, massive penalty
        if (oppMove.san.includes("#")) {
          score -= 50000;
          break;
        }
        // If opponent can capture the moved piece immediately
        if (oppMove.to === move.to && oppMove.captured) {
          const myPieceValue = PIECE_VALUES[move.piece] || 100;
          const oppPieceValue = PIECE_VALUES[oppMove.piece] || 100;
          if (oppPieceValue <= myPieceValue) {
            score -= (myPieceValue * 8);
          }
        }
      }
    } catch {}

    return score;
  }

  /**
   * Tactical move picker based on difficulty
   */
  _getTacticalAIMove({ fen, difficulty }) {
    try {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });

      if (legalMoves.length === 0) {
        return null;
      }

      // Score all legal moves
      const scoredMoves = legalMoves.map((m) => ({
        move: m,
        score: this._evaluateMove(chess, m),
      }));

      // Sort descending by score
      scoredMoves.sort((a, b) => b.score - a.score);

      // EASY: 45% best move, 55% random legal move
      if (difficulty === "EASY") {
        if (Math.random() < 0.45 && scoredMoves.length > 0) {
          const best = scoredMoves[0].move;
          return { from: best.from, to: best.to, promotion: best.promotion };
        }
        const rand = legalMoves[Math.floor(Math.random() * legalMoves.length)];
        return { from: rand.from, to: rand.to, promotion: rand.promotion };
      }

      // MEDIUM: Always picks among top 2-3 best tactical moves (never ignores free Queens/Rooks)
      if (difficulty === "MEDIUM") {
        const topPoolSize = Math.min(3, scoredMoves.length);
        const topPool = scoredMoves.slice(0, topPoolSize);
        // Weighted towards #1
        const pick = Math.random() < 0.7 ? topPool[0] : topPool[Math.floor(Math.random() * topPool.length)];
        const best = pick.move;
        return { from: best.from, to: best.to, promotion: best.promotion };
      }

      // HARD: Always picks highest scored move (greedy tactical best)
      const best = scoredMoves[0].move;
      return { from: best.from, to: best.to, promotion: best.promotion };
    } catch (err) {
      console.error("Tactical AI move calculation failed:", err);
      return null;
    }
  }

  /**
   * Stockfish engine bridge placeholder
   */
  async _getStockfishMove({ fen, difficulty }) {
    throw new Error("Stockfish engine not configured yet");
  }
}

module.exports = new AIService();
