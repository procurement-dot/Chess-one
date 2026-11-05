const { Chess } = require("chess.js");

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

  const centerSquares = ['d4', 'd5', 'e4', 'e5'];
  for (const sq of centerSquares) {
    const piece = chess.get(sq);
    if (piece) {
      score += piece.color === 'w' ? 18 : -18;
    }
  }

  if (chess.isCheck()) {
    score += chess.turn() === 'w' ? -40 : 40;
  }

  return score;
}

class AIService {
  /**
   * Calculate best move adhering to rating standards:
   * - EASY:   ~800
   * - MEDIUM: ~1400
   * - HARD:   ~1900-2000
   */
  async getBestMove({ fen, difficulty = "MEDIUM" }) {
    try {
      const chess = new Chess(fen);
      const legalMoves = chess.moves({ verbose: true });

      if (legalMoves.length === 0) return null;

      // 1. Instant checkmate in 1 check
      for (const m of legalMoves) {
        chess.move(m);
        if (chess.isCheckmate()) {
          chess.undo();
          return { from: m.from, to: m.to, promotion: m.promotion };
        }
        chess.undo();
      }

      // 2. Check opening book
      const bookMoves = OPENING_BOOK[fen];
      if (bookMoves && bookMoves.length > 0 && difficulty !== "EASY") {
        const selectedUci = bookMoves[Math.floor(Math.random() * bookMoves.length)];
        const from = selectedUci.slice(0, 2);
        const to = selectedUci.slice(2, 4);
        const matched = legalMoves.find((m) => m.from === from && m.to === to);
        if (matched) {
          return { from: matched.from, to: matched.to, promotion: matched.promotion };
        }
      }

      const isWhite = chess.turn() === "w";

      // 3. Move ordering
      legalMoves.sort((a, b) => {
        let sa = 0, sb = 0;
        if (a.captured) sa += (PIECE_VALUES[a.captured] || 100) * 10;
        if (b.captured) sb += (PIECE_VALUES[b.captured] || 100) * 10;
        if (a.promotion) sa += 800;
        if (b.promotion) sb += 800;
        if (a.san.includes('+')) sa += 60;
        if (b.san.includes('+')) sb += 60;
        return sb - sa;
      });

      let bestMove = legalMoves[0];
      let bestScore = isWhite ? -Infinity : Infinity;
      const scoredMoves = [];

      const maxOppCandidates =
        difficulty === "HARD" ? 12 : difficulty === "MEDIUM" ? 6 : 2;

      for (const m of legalMoves) {
        chess.move(m);
        let oppScore = isWhite ? Infinity : -Infinity;
        const oppMoves = chess.moves({ verbose: true });

        if (oppMoves.length === 0) {
          oppScore = evaluateBoard(chess);
        } else if (difficulty === "EASY") {
          oppScore = evaluateBoard(chess);
        } else {
          oppMoves.sort((a, b) => {
            let sa = 0, sb = 0;
            if (a.captured) sa += (PIECE_VALUES[a.captured] || 100) * 10;
            if (b.captured) sb += (PIECE_VALUES[b.captured] || 100) * 10;
            if (a.san.includes('#')) sa += 50000;
            if (b.san.includes('#')) sb += 50000;
            return sb - sa;
          });

          const candidates = oppMoves.slice(0, maxOppCandidates);
          for (const opp of candidates) {
            chess.move(opp);
            let s = evaluateBoard(chess);
            if (chess.isCheckmate()) {
              s = isWhite ? -100000 : 100000;
            }
            chess.undo();

            if (isWhite) {
              if (s < oppScore) oppScore = s;
            } else {
              if (s > oppScore) oppScore = s;
            }
          }
        }

        chess.undo();
        scoredMoves.push({ move: m, score: oppScore });

        if (isWhite) {
          if (oppScore > bestScore) {
            bestScore = oppScore;
            bestMove = m;
          }
        } else {
          if (oppScore < bestScore) {
            bestScore = oppScore;
            bestMove = m;
          }
        }
      }

      // Difficulty tuning
      if (difficulty === "EASY" && scoredMoves.length > 1) {
        scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));
        const safe = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        if (Math.random() < 0.35 && safe[1]) {
          bestMove = safe[1].move;
        } else {
          bestMove = safe[0].move;
        }
      } else if (difficulty === "MEDIUM" && scoredMoves.length > 1) {
        scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));
        const diff = Math.abs(scoredMoves[0].score - scoredMoves[1].score);
        if (diff < 35 && Math.random() < 0.2) {
          bestMove = scoredMoves[1].move;
        } else {
          bestMove = scoredMoves[0].move;
        }
      }

      return {
        from: bestMove.from,
        to: bestMove.to,
        promotion: bestMove.promotion,
      };
    } catch (err) {
      console.error("AI service move calculation failed:", err);
      return null;
    }
  }
}

const serviceInstance = new AIService();
serviceInstance.evaluateBoard = evaluateBoard;
serviceInstance.PIECE_VALUES = PIECE_VALUES;

module.exports = serviceInstance;
