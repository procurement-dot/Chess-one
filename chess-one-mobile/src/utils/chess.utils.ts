import { Square } from 'chess.js';
import { MovePair } from '../types/chess.types';

export const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS = ['8', '7', '6', '5', '4', '3', '2', '1'] as const;

export const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export type FileSymbol = typeof FILES[number];
export type RankSymbol = typeof RANKS[number];

/**
 * Converts col (0-7, a-h) and row (0-7, 8-1) to square notation
 */
export const coordsToSquare = (col: number, row: number): Square => {
  return `${FILES[col]}${RANKS[row]}` as Square;
};

/**
 * Converts square notation to column (0-7) and row (0-7)
 */
export const squareToCoords = (square: Square): { col: number; row: number } => {
  const file = square[0];
  const rank = square[1];
  const col = FILES.indexOf(file as FileSymbol);
  const row = RANKS.indexOf(rank as RankSymbol);
  return { col, row };
};

/**
 * Returns whether a square is light-colored (true) or dark-colored (false)
 */
export const isSquareLight = (col: number, row: number): boolean => {
  return (col + row) % 2 === 0;
};

/**
 * Groups flat SAN move history into numbered White and Black pairs
 */
export const groupMovePairs = (history: string[]): MovePair[] => {
  const pairs: MovePair[] = [];
  for (let i = 0; i < history.length; i += 2) {
    const moveNumber = Math.floor(i / 2) + 1;
    pairs.push({
      moveNumber,
      white: history[i],
      black: history[i + 1],
    });
  }
  return pairs;
};

/**
 * Human-readable piece names
 */
export const PIECE_NAMES: Record<string, string> = {
  p: 'Pawn',
  n: 'Knight',
  b: 'Bishop',
  r: 'Rook',
  q: 'Queen',
  k: 'King',
};

/**
 * Detect common chess opening names from initial SAN moves
 */
export const detectOpeningName = (moves: string[]): string => {
  if (!moves || moves.length === 0) return 'Standard Game';

  const m1 = moves[0];
  const m2 = moves[1];
  const m3 = moves[2];
  const m4 = moves[3];

  if (m1 === 'e4') {
    if (m2 === 'd5') return 'Scandinavian Defense';
    if (m2 === 'c5') return 'Sicilian Defense';
    if (m2 === 'e6') return 'French Defense';
    if (m2 === 'c6') return 'Caro-Kann Defense';
    if (m2 === 'e5') {
      if (m3 === 'Nf3') {
        if (m4 === 'Nc6') return 'Open Game';
        if (m4 === 'Nf6') return 'Petrov Defense';
        if (m4 === 'd6') return 'Philidor Defense';
      }
      if (m3 === 'Bc4') return "Bishop's Opening";
      if (m3 === 'f4') return "King's Gambit";
      return "King's Pawn Game";
    }
    if (m2 === 'd6') return 'Pirc Defense';
    if (m2 === 'Nf6') return "Alekhine's Defense";
    if (m2 === 'g6') return 'Modern Defense';
    return "King's Pawn Opening";
  }

  if (m1 === 'd4') {
    if (m2 === 'd5') {
      if (m3 === 'c4') return "Queen's Gambit";
      if (m3 === 'Nf3') return "Queen's Pawn Game";
      if (m3 === 'Bf4') return 'London System';
      return "Queen's Pawn Opening";
    }
    if (m2 === 'Nf6') {
      if (m3 === 'c4') return 'Indian Defense';
      return 'Indian Game';
    }
    if (m2 === 'f5') return 'Dutch Defense';
    if (m2 === 'e6') return 'Horwitz Defense';
    return "Queen's Pawn Opening";
  }

  if (m1 === 'c4') return 'English Opening';
  if (m1 === 'Nf3') return 'Réti Opening';
  if (m1 === 'f4') return "Bird's Opening";
  if (m1 === 'b3') return 'Nimzo-Larsen Attack';
  if (m1 === 'g3') return "King's Indian Attack";
  if (m1 === 'a4') return 'Ware Opening';
  if (m1 === 'b4') return 'Sokolsky Opening';
  if (m1 === 'g4') return 'Grob Opening';
  if (m1 === 'h4') return 'Kadas Opening';
  if (m1 === 'c3') return 'Saragossa Opening';
  if (m1 === 'd3') return 'Mieses Opening';
  if (m1 === 'e3') return "Van 't Kruijs Opening";
  if (m1 === 'Nc3') return 'Dunst Opening';
  if (m1 === 'Na3') return 'Durkin Opening';
  if (m1 === 'Nh3') return 'Amar Opening';

  return 'Classical Opening';
};
