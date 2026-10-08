const { Chess } = require("chess.js");

/**
 * AI Service Interface
 * Designed for future drop-in Stockfish / UCI engine integration
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
    // Check if Stockfish is configured (future extension)
    if (process.env.STOCKFISH_PATH) {
      return this._getStockfishMove({ fen, difficulty });
    }

    // Default development fallback: intelligent legal move generator
    return this._getDevelopmentAIMove({ fen, difficulty });
  }

  /**
   * Internal development fallback using chess.js legal moves
   */
  _getDevelopmentAIMove({ fen, difficulty }) {
    try {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });

      if (legalMoves.length === 0) {
        return null;
      }

      // Prioritize captures and checks for higher difficulties
      if (difficulty === "HARD") {
        const tacticalMoves = legalMoves.filter(
          (m) => m.captured || m.san.includes("+") || m.san.includes("#")
        );
        if (tacticalMoves.length > 0) {
          const move = tacticalMoves[Math.floor(Math.random() * tacticalMoves.length)];
          return { from: move.from, to: move.to, promotion: move.promotion };
        }
      }

      // Medium: prefers non-blunder moves
      if (difficulty === "MEDIUM") {
        const nonPawnMoves = legalMoves.filter((m) => m.piece !== "p");
        if (nonPawnMoves.length > 0 && Math.random() > 0.4) {
          const move = nonPawnMoves[Math.floor(Math.random() * nonPawnMoves.length)];
          return { from: move.from, to: move.to, promotion: move.promotion };
        }
      }

      // Easy / Random legal move
      const move = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      return {
        from: move.from,
        to: move.to,
        promotion: move.promotion,
      };
    } catch (err) {
      console.error("AI service move calculation failed:", err);
      return null;
    }
  }

  /**
   * Stockfish engine bridge placeholder (to be wired when engine binary is available)
   */
  async _getStockfishMove({ fen, difficulty }) {
    throw new Error("Stockfish engine not configured yet");
  }
}

module.exports = new AIService();
