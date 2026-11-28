const { Chess } = require("chess.js");
const stockfishService = require("./stockfish.service");

// Material piece weights (Centipawns)
const PIECE_VALUES = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 920,
  k: 20000,
};

// Piece-Square Tables (White perspective; mirror for Black)
const PAWN_PST = [
  0,   0,   0,   0,   0,   0,   0,   0,
  50,  50,  50,  50,  50,  50,  50,  50,
  10,  15,  25,  35,  35,  25,  15,  10,
  5,   5,  15,  28,  28,  15,   5,   5,
  0,   0,  10,  25,  25,  10,   0,   0,
  5,  -5, -10,   5,   5, -10,  -5,   5,
  5,  10,  10, -20, -20,  10,  10,   5,
  0,   0,   0,   0,   0,   0,   0,   0,
];

const KNIGHT_PST = [
  -50, -40, -30, -30, -30, -30, -40, -50,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -30,   5,  20,  25,  25,  20,   5, -30,
  -30,   5,  20,  25,  25,  20,   5, -30,
  -30,   5,  15,  20,  20,  15,   5, -30,
  -40, -20,   0,   5,   5,   0, -20, -40,
  -50, -40, -30, -30, -30, -30, -40, -50,
];

const BISHOP_PST = [
  -20, -10, -10, -10, -10, -10, -10, -20,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -10,  10,  10,  15,  15,  10,  10, -10,
  -10,   5,  15,  18,  18,  15,   5, -10,
  -10,   5,  15,  18,  18,  15,   5, -10,
  -10,  10,  10,  15,  15,  10,  10, -10,
  -10,   5,   0,   0,   0,   0,   5, -10,
  -20, -10, -10, -10, -10, -10, -10, -20,
];

const ROOK_PST = [
  0,   0,   0,   5,   5,   0,   0,   0,
  10,  15,  15,  15,  15,  15,  15,  10,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
  -5,   0,   0,   0,   0,   0,   0,  -5,
   0,   0,   5,  10,  10,   5,   0,   0,
];

const QUEEN_PST = [
  -20, -10, -10,  -5,  -5, -10, -10, -20,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -10,   5,   5,   5,   5,   5,   0, -10,
   -5,   0,   5,   5,   5,   5,   0,  -5,
    0,   0,   5,   5,   5,   5,   0,  -5,
  -10,   5,   5,   5,   5,   5,   0, -10,
  -10,   0,   5,   0,   0,   0,   0, -10,
  -20, -10, -10,  -5,  -5, -10, -10, -20,
];

const KING_MG_PST = [
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -30, -40, -40, -50, -50, -40, -40, -30,
  -20, -30, -30, -40, -40, -30, -30, -20,
  -10, -20, -20, -20, -20, -20, -20, -10,
   20,  20,   0,   0,   0,   0,  20,  20,
   20,  30,  10,   0,   0,  10,  30,  20,
];

const KING_EG_PST = [
  -50, -30, -30, -30, -30, -30, -30, -50,
  -30, -15,   0,   0,   0,   0, -15, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30,   0,  20,  30,  30,  20,   0, -30,
  -30,   0,  20,  30,  30,  20,   0, -30,
  -30,   0,  15,  20,  20,  15,   0, -30,
  -30, -15,   0,   0,   0,   0, -15, -30,
  -50, -30, -30, -30, -30, -30, -30, -50,
];

const OPENING_BOOK = {
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1': [
    'e2e4', 'd2d4', 'g1f3', 'c2c4',
  ],
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1': [
    'e7e5', 'c7c5', 'e7e6', 'c7c6',
  ],
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1': [
    'd7d5', 'g8f6', 'e7e6',
  ],
};

function squareToIndex(sq, forWhite) {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
  const index = rank * 8 + file;
  return forWhite ? index : 63 - index;
}

function evaluateBoard(chess) {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }

  let score = 0;
  let totalNonPawnMaterial = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      if (piece.type !== 'p' && piece.type !== 'k') {
        totalNonPawnMaterial += val;
      }

      const fileChar = String.fromCharCode(97 + c);
      const rankNum = 8 - r;
      const sq = `${fileChar}${rankNum}`;
      const isWhite = piece.color === 'w';
      const idx = squareToIndex(sq, isWhite);

      let pst = 0;
      if (piece.type === 'p') pst = PAWN_PST[idx];
      else if (piece.type === 'n') pst = KNIGHT_PST[idx];
      else if (piece.type === 'b') pst = BISHOP_PST[idx];
      else if (piece.type === 'r') pst = ROOK_PST[idx];
      else if (piece.type === 'q') pst = QUEEN_PST[idx];
      else if (piece.type === 'k') {
        const isEndgame = totalNonPawnMaterial < 2500;
        pst = isEndgame ? KING_EG_PST[idx] : KING_MG_PST[idx];
      }

      const pieceScore = val + pst;
      score += isWhite ? pieceScore : -pieceScore;
    }
  }

  const fenParts = chess.fen().split(" ");
  const moveNumber = parseInt(fenParts[5] || "1", 10);

  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const sq of centerSquares) {
    const piece = chess.get(sq);
    if (piece) {
      if (piece.type === 'q' && moveNumber < 8) {
        // Queen exposed in center too early is a tactical liability
        score += piece.color === 'w' ? -25 : 25;
      } else {
        score += piece.color === 'w' ? 18 : -18;
      }
    }
  }

  // Early queen penalty: if Queen leaves home rank before move 8 while minors are undeveloped
  if (moveNumber < 8) {
    const whiteMinorsAtHome = ['b1', 'c1', 'f1', 'g1'].filter((sq) => {
      const p = chess.get(sq);
      return p && p.color === 'w' && (p.type === 'n' || p.type === 'b');
    }).length;
    const whiteQueenAtHome = chess.get('d1')?.type === 'q' && chess.get('d1')?.color === 'w';
    if (!whiteQueenAtHome && whiteMinorsAtHome >= 2) {
      score -= 70;
    }

    const blackMinorsAtHome = ['b8', 'c8', 'f8', 'g8'].filter((sq) => {
      const p = chess.get(sq);
      return p && p.color === 'b' && (p.type === 'n' || p.type === 'b');
    }).length;
    const blackQueenAtHome = chess.get('d8')?.type === 'q' && chess.get('d8')?.color === 'b';
    if (!blackQueenAtHome && blackMinorsAtHome >= 2) {
      score += 70;
    }
  }

  return score;
}

class AIService {
  /**
   * Calculate best move using backend Stockfish engine with difficulty settings:
   * - EASY:   ~800 Elo
   * - MEDIUM: ~1400 Elo
   * - HARD:   ~2000+ Elo
   */
  async getBestMove({ fen, difficulty = "MEDIUM", timeControl, remainingTimeMs }) {
    try {
      const sfMove = await stockfishService.getBestMove({
        fen,
        difficulty,
        timeControl,
        remainingTimeMs,
      });

      if (sfMove) {
        return {
          from: sfMove.from,
          to: sfMove.to,
          promotion: sfMove.promotion,
          san: sfMove.san,
        };
      }
    } catch (err) {
      console.error("[AIService] Stockfish getBestMove failed:", err);
    }

    // Fallback: pick best immediate move if Stockfish engine is temporarily unavailable
    try {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });
      if (legalMoves.length === 0) return null;

      // Check mate in 1
      for (const m of legalMoves) {
        chess.move(m);
        if (chess.isCheckmate()) {
          chess.undo();
          return { from: m.from, to: m.to, promotion: m.promotion, san: m.san };
        }
        chess.undo();
      }

      // Safe capture or first move
      const capture = legalMoves.find((m) => m.captured);
      const chosen = capture || legalMoves[0];
      return {
        from: chosen.from,
        to: chosen.to,
        promotion: chosen.promotion,
        san: chosen.san,
      };
    } catch (fallbackErr) {
      console.error("[AIService] Fallback move generation failed:", fallbackErr);
      return null;
    }
  }
}

const serviceInstance = new AIService();
serviceInstance.evaluateBoard = evaluateBoard;
serviceInstance.PIECE_VALUES = PIECE_VALUES;

module.exports = serviceInstance;
