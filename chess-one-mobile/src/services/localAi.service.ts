import { Chess, Square } from 'chess.js';
import { AIDifficulty } from '../types/game.types';

export interface BestMoveResult {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

// Material piece weights
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

// Positional Piece-Square Tables (White perspective; mirror for Black)
const PAWN_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
  5,  5, 10, 25, 25, 10,  5,  5,
  0,  0,  0, 20, 20,  0,  0,  0,
  5, -5,-10,  0,  0,-10, -5,  5,
  5, 10, 10,-20,-20, 10, 10,  5,
  0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_PST = [
  -50,-40,-30,-30,-30,-30,-40,-50,
  -40,-20,  0,  0,  0,  0,-20,-40,
  -30,  0, 10, 15, 15, 10,  0,-30,
  -30,  5, 15, 20, 20, 15,  5,-30,
  -30,  0, 15, 20, 20, 15,  0,-30,
  -30,  5, 10, 15, 15, 10,  5,-30,
  -40,-20,  0,  5,  5,  0,-20,-40,
  -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_PST = [
  -20,-10,-10,-10,-10,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5, 10, 10,  5,  0,-10,
  -10,  5,  5, 10, 10,  5,  5,-10,
  -10,  0, 10, 10, 10, 10,  0,-10,
  -10, 10, 10, 10, 10, 10, 10,-10,
  -10,  5,  0,  0,  0,  0,  5,-10,
  -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_PST = [
  0,  0,  0,  0,  0,  0,  0,  0,
  5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_PST = [
  -20,-10,-10, -5, -5,-10,-10,-20,
  -10,  0,  0,  0,  0,  0,  0,-10,
  -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
  0,  0,  5,  5,  5,  5,  0, -5,
  -10,  5,  5,  5,  5,  5,  0,-10,
  -10,  0,  5,  0,  0,  0,  0,-10,
  -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_PST = [
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -30,-40,-40,-50,-50,-40,-40,-30,
  -20,-30,-30,-40,-40,-30,-30,-20,
  -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20,
];

function squareToIndex(sq: string, forWhite: boolean): number {
  const file = sq.charCodeAt(0) - 97; // a=0, h=7
  const rank = 8 - parseInt(sq[1], 10); // 8=0, 1=7
  const index = rank * 8 + file;
  return forWhite ? index : 63 - index;
}

function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }

  let score = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
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
      else if (piece.type === 'k') pst = KING_PST[idx];

      const pieceTotal = val + pst;
      score += isWhite ? pieceTotal : -pieceTotal;
    }
  }

  return score;
}

function minimax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean
): number {
  if (depth === 0 || chess.isGameOver()) {
    return evaluateBoard(chess);
  }

  const moves = chess.moves({ verbose: true });
  // Move ordering: sort captures and checks first to optimize alpha-beta cutoff
  moves.sort((a, b) => {
    let aScore = 0;
    let bScore = 0;
    if (a.captured) aScore += (PIECE_VALUES[a.captured] || 0) * 10 - (PIECE_VALUES[a.piece] || 0);
    if (b.captured) bScore += (PIECE_VALUES[b.captured] || 0) * 10 - (PIECE_VALUES[b.piece] || 0);
    if (a.san.includes('+') || a.san.includes('#')) aScore += 50;
    if (b.san.includes('+') || b.san.includes('#')) bScore += 50;
    return bScore - aScore;
  });

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, false);
      chess.undo();
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      chess.move(move);
      const evaluation = minimax(chess, depth - 1, alpha, beta, true);
      chess.undo();
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

class LocalAIService {
  /**
   * Calculate best chess move locally on device with fast, configurable movetime
   */
  async getBestMove(
    fen: string,
    difficulty: AIDifficulty = 'MEDIUM'
  ): Promise<BestMoveResult | null> {
    const startTime = Date.now();
    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) return null;

    const isWhite = chess.turn() === 'w';

    // Target thinking delays for smooth, responsive human feel:
    // In a 1-minute game, Medium answers in 350-500ms (well under 1 second)
    const targetDelayMs =
      difficulty === 'EASY'
        ? 200 + Math.random() * 150   // 200 - 350ms
        : difficulty === 'HARD'
        ? 550 + Math.random() * 200   // 550 - 750ms
        : 350 + Math.random() * 200;  // 350 - 550ms (Medium)

    let selectedMove = legalMoves[0];

    if (difficulty === 'EASY') {
      // 70% random legal move, 30% take highest capture
      const captures = legalMoves.filter((m) => Boolean(m.captured));
      if (captures.length > 0 && Math.random() > 0.5) {
        selectedMove = captures[Math.floor(Math.random() * captures.length)];
      } else {
        selectedMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
      }
    } else {
      const searchDepth = difficulty === 'HARD' ? 3 : 2;

      let bestScore = isWhite ? -Infinity : Infinity;
      const scoredMoves: { move: typeof legalMoves[0]; score: number }[] = [];

      for (const move of legalMoves) {
        chess.move(move);
        const score = minimax(
          chess,
          searchDepth - 1,
          -Infinity,
          Infinity,
          !isWhite
        );
        chess.undo();

        scoredMoves.push({ move, score });

        if (isWhite) {
          if (score > bestScore) {
            bestScore = score;
            selectedMove = move;
          }
        } else {
          if (score < bestScore) {
            bestScore = score;
            selectedMove = move;
          }
        }
      }

      // Medium adds slight randomness among the top 3 best moves to avoid repetitive play
      if (difficulty === 'MEDIUM' && scoredMoves.length > 1) {
        scoredMoves.sort((a, b) =>
          isWhite ? b.score - a.score : a.score - b.score
        );
        const topMoves = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
        if (Math.random() < 0.35 && topMoves[1]) {
          selectedMove = topMoves[1].move;
        } else {
          selectedMove = topMoves[0].move;
        }
      }
    }

    // Wait remaining delay to fulfill movetime smoothly
    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(50, targetDelayMs - elapsed);
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));

    return {
      from: selectedMove.from,
      to: selectedMove.to,
      promotion: selectedMove.promotion,
      san: selectedMove.san,
    };
  }
}

export const localAiService = new LocalAIService();
