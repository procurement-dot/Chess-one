const { Chess } = require("chess.js");

const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

/**
 * Create a new chess instance with optional FEN
 */
function createChessInstance(fen = STARTING_FEN) {
  return new Chess(fen);
}

/**
 * Validate and apply a move to a chess game
 * @param {string} fen - Current board FEN
 * @param {object} move - { from, to, promotion }
 * @param {string} [currentPgn] - Existing PGN string to preserve full move history
 * @returns {object} { success: boolean, moveDetails: object, chess: Chess, error: string }
 */
function validateAndApplyMove(fen, { from, to, promotion }, currentPgn = "") {
  try {
    let chess;
    if (currentPgn && currentPgn.trim().length > 0) {
      try {
        chess = new Chess();
        chess.loadPgn(currentPgn);
      } catch (e) {
        chess = new Chess(fen);
      }
    } else {
      chess = new Chess(fen);
    }

    const moveOptions = {
      from: from.toLowerCase(),
      to: to.toLowerCase(),
    };

    if (promotion) {
      moveOptions.promotion = promotion.toLowerCase();
    }

    const result = chess.move(moveOptions);

    if (!result) {
      return { success: false, error: "Illegal chess move" };
    }

    return {
      success: true,
      moveDetails: {
        from: result.from,
        to: result.to,
        san: result.san,
        piece: result.piece,
        color: result.color === "w" ? "WHITE" : "BLACK",
        flags: result.flags,
        captured: result.captured || null,
        promotion: result.promotion || null,
        fenAfter: chess.fen(),
        inCheck: chess.inCheck(),
        isCheckmate: chess.isCheckmate(),
        isStalemate: chess.isStalemate(),
        isDraw: chess.isDraw(),
        isThreefoldRepetition: chess.isThreefoldRepetition ? chess.isThreefoldRepetition() : false,
        isInsufficientMaterial: chess.isInsufficientMaterial ? chess.isInsufficientMaterial() : false,
      },
      chess,
    };
  } catch (err) {
    return { success: false, error: err.message || "Invalid move" };
  }
}

/**
 * Convert chess.js color ('w' | 'b') to PlayerColor enum ('WHITE' | 'BLACK')
 */
function toPlayerColor(char) {
  return char === "w" ? "WHITE" : "BLACK";
}

/**
 * Convert PlayerColor enum ('WHITE' | 'BLACK') to chess.js color ('w' | 'b')
 */
function toChessChar(color) {
  return color === "WHITE" ? "w" : "b";
}

module.exports = {
  STARTING_FEN,
  createChessInstance,
  validateAndApplyMove,
  toPlayerColor,
  toChessChar,
};
