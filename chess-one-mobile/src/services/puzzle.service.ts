import { apiClient } from './apiClient';
import { CHESS_PUZZLES, PuzzleItem } from '../data/learn/puzzlesData';
import { Chess } from 'chess.js';

export interface DbPuzzle {
  id: string;
  fen: string;
  moves: string;
  rating: number;
  themes: string;
  gameUrl?: string;
  openingTags?: string;
}

export interface FetchPuzzlesParams {
  tier?: 'Foundation' | 'Pre-Intermediate' | 'Intermediate' | 'Pre-Advance' | 'Advance';
  theme?: string;
  minRating?: number;
  maxRating?: number;
  limit?: number;
  page?: number;
  random?: boolean;
}

/**
 * Transforms raw Supabase Lichess puzzle into a playable mobile PuzzleItem
 */
export function formatDbPuzzle(dbPuz: DbPuzzle, index: number = 1): PuzzleItem | null {
  try {
    const moves = dbPuz.moves.split(' ');
    if (moves.length < 2) return null;

    const m1 = moves[0];
    const m2 = moves[1];

    const c = new Chess(dbPuz.fen);
    // Apply opponent's move m1
    const from1 = m1.slice(0, 2);
    const to1 = m1.slice(2, 4);
    const promo1 = m1.length > 4 ? m1[4] : undefined;
    c.move({ from: from1, to: to1, promotion: promo1 as any });

    const puzzleFen = c.fen();
    const turn = c.turn();

    // Apply player's winning move m2
    const from2 = m2.slice(0, 2);
    const to2 = m2.slice(2, 4);
    const promo2 = m2.length > 4 ? m2[4] : undefined;
    const winningMove = c.move({ from: from2, to: to2, promotion: promo2 as any });
    if (!winningMove) return null;

    const isMate = c.isCheckmate();
    const solutionSan = winningMove.san;

    // Get legal alternative moves for wrong choices
    c.undo();
    const legalMoves = c.moves({ verbose: true }).filter(m => m.san !== solutionSan);
    const alt1 = legalMoves[0] ? legalMoves[0].san : 'Nf3';
    const alt2 = legalMoves[1] ? legalMoves[1].san : 'Kh1';

    const turnNum = turn === 'w' ? '1.' : '1...';

    return {
      id: dbPuz.id,
      number: index,
      title: `Tactical Puzzle #${dbPuz.id}`,
      subtitle: `${turn === 'w' ? 'White' : 'Black'} to move · Find the winning move`,
      theme: (dbPuz.themes.includes('mate') ? 'Mate in 1' : 'Knight Fork') as any,
      rating: dbPuz.rating,
      fen: puzzleFen,
      turn,
      solutionSan,
      coachHint: `Look for an aggressive tactic! Spot the winning move for ${turn === 'w' ? 'White' : 'Black'}.`,
      explanation: `${turnNum} ${solutionSan} is the winning tactic from Lichess game #${dbPuz.id}.`,
      xpReward: Math.round(dbPuz.rating / 30),
      choices: [
        {
          san: solutionSan,
          label: `${turnNum} ${solutionSan} ${isMate ? '(Checkmate!)' : '(Winning Move)'}`,
          isCorrect: true,
          coachFeedback: isMate ? '⚡ BOOM! Checkmate delivered!' : '🎯 Excellent move! Decisive tactical advantage.',
        },
        {
          san: alt1,
          label: `${turnNum} ${alt1} (Alternative Move)`,
          isCorrect: false,
          coachFeedback: `${turnNum} ${alt1} is playable, but it misses the decisive knockout!`,
        },
        {
          san: alt2,
          label: `${turnNum} ${alt2} (Passive Move)`,
          isCorrect: false,
          coachFeedback: `Too slow! Look for an aggressive check or capture.`,
        },
      ],
    };
  } catch (e) {
    return null;
  }
}

export const puzzleService = {
  /**
   * Fetch live puzzles from 32,241 Supabase database
   */
  async getPuzzles(params: FetchPuzzlesParams = {}): Promise<PuzzleItem[]> {
    try {
      let response;
      try {
        response = await apiClient.get('/api/puzzles', { params });
      } catch {
        response = await apiClient.get('/puzzles', { params });
      }
      if (response.data && response.data.data && Array.isArray(response.data.data.puzzles)) {
        const dbPuzzles: DbPuzzle[] = response.data.data.puzzles;
        const formatted = dbPuzzles
          .map((p, idx) => formatDbPuzzle(p, idx + 1))
          .filter((p): p is PuzzleItem => p !== null);

        if (formatted.length > 0) {
          return formatted;
        }
      }
    } catch (err) {
      console.warn('Backend puzzle fetch failed, falling back to local dataset:', err);
    }

    // Fallback to local curated puzzles
    return CHESS_PUZZLES;
  },

  /**
   * Fetch Daily Puzzle from 32,241 Supabase database
   */
  async getDailyPuzzle(): Promise<PuzzleItem> {
    try {
      let response;
      try {
        response = await apiClient.get('/api/puzzles/daily');
      } catch {
        response = await apiClient.get('/puzzles/daily');
      }
      if (response.data?.data?.puzzle) {
        const formatted = formatDbPuzzle(response.data.data.puzzle, 1);
        if (formatted) return formatted;
      }
    } catch (err) {
      console.warn('Daily puzzle fetch failed, falling back:', err);
    }
    return CHESS_PUZZLES[0];
  },
};
