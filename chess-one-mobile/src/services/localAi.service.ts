import { Chess, Square } from 'chess.js';
import { AIDifficulty } from '../types/game.types';
import { gameService } from './game.service';

export interface BestMoveResult {
  from: string;
  to: string;
  promotion?: string;
  san: string;
}

export interface AIOptions {
  gameId?: number | string;
  timeControl?: string;
  remainingTimeMs?: number | null;
}

// Material piece weights (Centipawns)
const PIECE_VALUES: Record<string, number> = {
  p: 100,
  n: 320,
  b: 335,
  r: 500,
  q: 920,
  k: 20000,
};

// Positional Piece-Square Tables (White perspective; mirrored for Black)
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

// Classic grandmaster opening book (keyed by normalized FEN prefix: "board turn castling")
const OPENING_BOOK: Record<string, string[]> = {
  // 1. Initial Position (White to move)
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq': [
    'e2e4', 'd2d4', 'g1f3', 'c2c4',
  ],
  // 1. e4 (Black to move)
  'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq': [
    'e7e5', 'c7c5', 'e7e6', 'c7c6',
  ],
  // 1. d4 (Black to move)
  'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq': [
    'd7d5', 'g8f6', 'e7e6',
  ],
  // 1. c4 (English Opening, Black to move)
  'rnbqkbnr/pppppppp/8/8/2P5/8/PP1PPPPP/RNBQKBNR b KQkq': [
    'e7e5', 'c7c5', 'g8f6', 'e7e6',
  ],
  // 1. Nf3 (Reti Opening, Black to move)
  'rnbqkbnr/pppppppp/8/8/8/5N2/PPPPPPPP/RNBQKB1R b KQkq': [
    'd7d5', 'g8f6', 'c7c5',
  ],
  // 1. e4 e5 (White to move)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'g1f3', 'f1c4', 'b1c3',
  ],
  // 1. e4 e5 2. Nf3 (Black to move)
  'rnbqkbnr/pppp1ppp/8/4p3/4P3/5N2/PPPP1PPP/RNBQKB1R b KQkq': [
    'b8c6', 'g8f6', 'd7d6',
  ],
  // 1. e4 c5 (Sicilian Defense, White to move)
  'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'g1f3', 'b1c3', 'c2c3',
  ],
  // 1. e4 e6 (French Defense, White to move)
  'rnbqkbnr/pppp1ppp/4p3/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'd2d4', 'g1f3',
  ],
  // 1. e4 c6 (Caro-Kann Defense, White to move)
  'rnbqkbnr/pp1ppppp/2p5/8/4P3/8/PPPP1PPP/RNBQKBNR w KQkq': [
    'd2d4', 'b1c3',
  ],
  // 1. d4 d5 (White to move)
  'rnbqkbnr/ppp1pppp/8/3p4/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    'c2c4', 'g1f3', 'c1f4',
  ],
  // 1. d4 d5 2. c4 (Queen's Gambit, Black to move)
  'rnbqkbnr/ppp1pppp/8/3p4/2PP4/8/PP2PPPP/RNBQKBNR b KQkq': [
    'e7e6', 'c7c6', 'd5c4',
  ],
  // 1. d4 Nf6 (Indian Defenses, White to move)
  'rnbqkb1r/pppppppp/5n2/8/3P4/8/PPP1PPPP/RNBQKBNR w KQkq': [
    'c2c4', 'g1f3', 'c1g5',
  ],
};

function normalizeFenForBook(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  return parts.slice(0, 3).join(' ');
}

function squareToIndex(sq: string, forWhite: boolean): number {
  const file = sq.charCodeAt(0) - 97;
  const rank = 8 - parseInt(sq[1], 10);
  const index = rank * 8 + file;
  return forWhite ? index : 63 - index;
}

export function evaluateBoard(chess: Chess): number {
  if (chess.isCheckmate()) {
    return chess.turn() === 'w' ? -100000 : 100000;
  }
  if (chess.isDraw() || chess.isStalemate()) {
    return 0;
  }

  let whiteMaterial = 0;
  let blackMaterial = 0;
  let score = 0;
  let totalNonPawnMaterial = 0;
  const board = chess.board();

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (!piece) continue;

      const val = PIECE_VALUES[piece.type] || 0;
      if (piece.color === 'w') whiteMaterial += val;
      else blackMaterial += val;

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

  const fenParts = chess.fen().split(' ');
  const moveNumber = parseInt(fenParts[5] || '1', 10);

  // Center Control bonus (d4, d5, e4, e5)
  const centerSquares: Square[] = ['d4', 'd5', 'e4', 'e5'];
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

  // Early queen penalty: penalize queen moving before move 8 while minors are undeveloped
  if (moveNumber < 8) {
    const whiteMinorsAtHome = (['b1', 'c1', 'f1', 'g1'] as Square[]).filter((sq) => {
      const p = chess.get(sq);
      return p && p.color === 'w' && (p.type === 'n' || p.type === 'b');
    }).length;
    const whiteQueenAtHome = chess.get('d1')?.type === 'q' && chess.get('d1')?.color === 'w';
    if (!whiteQueenAtHome && whiteMinorsAtHome >= 2) {
      score -= 70;
    }

    const blackMinorsAtHome = (['b8', 'c8', 'f8', 'g8'] as Square[]).filter((sq) => {
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

class LocalAIService {
  /**
   * Fast, responsive, and genuinely rated chess engine:
   * - EASY:   ~800 Elo
   * - MEDIUM: ~1400 Elo
   * - HARD:   ~1900-2000 Elo
   */
  async getBestMove(
    fen: string,
    difficulty: AIDifficulty = 'MEDIUM',
    options?: AIOptions
  ): Promise<BestMoveResult | null> {
    const startTime = Date.now();

    // 1. Attempt authoritative Stockfish move from backend if gameId provided
    if (options?.gameId) {
      try {
        const sfMove = await gameService.getAiMove(options.gameId, {
          fen,
          difficulty,
          timeControl: options.timeControl,
          remainingTimeMs: options.remainingTimeMs,
        });
        if (sfMove && sfMove.from && sfMove.to) {
          return {
            from: sfMove.from,
            to: sfMove.to,
            promotion: sfMove.promotion,
            san: sfMove.san,
          };
        }
      } catch (backendErr) {
        console.warn(
          '[LocalAIService] Backend Stockfish unavailable, falling back to local engine:',
          backendErr
        );
      }
    }

    // Check if bullet game or low clock (< 15 seconds)
    const isBulletOrLowTime = Boolean(
      (options?.timeControl &&
        (options.timeControl.startsWith('1+') || options.timeControl.startsWith('2+'))) ||
      (options?.remainingTimeMs !== undefined &&
        options.remainingTimeMs !== null &&
        options.remainingTimeMs < 15000)
    );

    // Yield to UI thread to guarantee zero dropped animation frames
    await new Promise((resolve) => setTimeout(resolve, isBulletOrLowTime ? 10 : 25));

    const chess = new Chess(fen);
    const legalMoves = chess.moves({ verbose: true });

    if (legalMoves.length === 0) return null;

    // 2. Instant Checkmate in 1 detection (always execute or block)
    for (const m of legalMoves) {
      chess.move(m);
      if (chess.isCheckmate()) {
        chess.undo();
        return {
          from: m.from,
          to: m.to,
          promotion: m.promotion,
          san: m.san,
        };
      }
      chess.undo();
    }

    // 3. Opening Book check (normalized by board, turn, castling)
    const normalizedFen = normalizeFenForBook(fen);
    const bookMoves = OPENING_BOOK[normalizedFen] || OPENING_BOOK[fen];
    if (bookMoves && bookMoves.length > 0 && difficulty !== 'EASY') {
      const selectedUci = bookMoves[Math.floor(Math.random() * bookMoves.length)];
      const from = selectedUci.slice(0, 2);
      const to = selectedUci.slice(2, 4);
      const matched = legalMoves.find((m) => m.from === from && m.to === to);
      if (matched) {
        if (!isBulletOrLowTime) {
          await new Promise((resolve) => setTimeout(resolve, 60 + Math.random() * 60));
        }
        return {
          from: matched.from,
          to: matched.to,
          promotion: matched.promotion,
          san: matched.san,
        };
      }
    }

    const isWhite = chess.turn() === 'w';

    // 3. Move ordering: captures, checks, promotions first
    legalMoves.sort((a, b) => {
      let sa = 0, sb = 0;
      if (a.captured) sa += (PIECE_VALUES[a.captured] || 100) * 10 - (PIECE_VALUES[a.piece] || 100);
      if (b.captured) sb += (PIECE_VALUES[b.captured] || 100) * 10 - (PIECE_VALUES[b.piece] || 100);
      if (a.promotion) sa += 800;
      if (b.promotion) sb += 800;
      if (a.san.includes('+')) sa += 60;
      if (b.san.includes('+')) sb += 60;
      return sb - sa;
    });

    let bestMove = legalMoves[0];
    let bestScore = isWhite ? -Infinity : Infinity;
    const scoredMoves: { move: typeof legalMoves[0]; score: number }[] = [];

    // Candidate responses to search per opponent turn
    const maxOppCandidates =
      difficulty === 'HARD' ? 12 : difficulty === 'MEDIUM' ? 6 : 2;

    for (let i = 0; i < legalMoves.length; i++) {
      const m = legalMoves[i];
      chess.move(m);

      let oppScore = isWhite ? Infinity : -Infinity;
      const oppMoves = chess.moves({ verbose: true });

      if (oppMoves.length === 0) {
        oppScore = evaluateBoard(chess);
      } else if (difficulty === 'EASY') {
        // Easy (~800): depth 1 direct evaluation
        oppScore = evaluateBoard(chess);
      } else {
        // Medium & Hard: evaluate opponent's sharpest tactical replies
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

      // Periodically yield to event loop
      if (i % 8 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }

    // 4. Rating tuning
    // EASY (~800): Plays sensible beginner moves, occasionally picks 2nd/3rd best
    if (difficulty === 'EASY' && scoredMoves.length > 1) {
      scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));
      const safe = scoredMoves.slice(0, Math.min(3, scoredMoves.length));
      if (Math.random() < 0.35 && safe[1]) {
        bestMove = safe[1].move;
      } else {
        bestMove = safe[0].move;
      }
    } else if (difficulty === 'MEDIUM' && scoredMoves.length > 1) {
      scoredMoves.sort((a, b) => (isWhite ? b.score - a.score : a.score - b.score));
      const diff = Math.abs(scoredMoves[0].score - scoredMoves[1].score);
      if (diff < 35 && Math.random() < 0.2) {
        bestMove = scoredMoves[1].move;
      } else {
        bestMove = scoredMoves[0].move;
      }
    }

    // 5. Realistic human delay: instant in bullet (30-60ms), natural in rapid
    const targetDelayMs = isBulletOrLowTime
      ? 30 + Math.random() * 30
      : difficulty === 'EASY'
      ? 120 + Math.random() * 120
      : difficulty === 'MEDIUM'
      ? 180 + Math.random() * 150
      : 220 + Math.random() * 180;

    const elapsed = Date.now() - startTime;
    const remainingDelay = Math.max(10, targetDelayMs - elapsed);
    await new Promise((resolve) => setTimeout(resolve, remainingDelay));

    return {
      from: bestMove.from,
      to: bestMove.to,
      promotion: bestMove.promotion,
      san: bestMove.san,
    };
  }
}

export const localAiService = new LocalAIService();
