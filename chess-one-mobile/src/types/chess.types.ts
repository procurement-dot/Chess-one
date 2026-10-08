import { Square, PieceSymbol, Color, Move } from 'chess.js';

export type GameStatus =
  | 'active'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'threefold_repetition'
  | 'insufficient_material'
  | 'fifty_moves'
  | 'draw';

export interface GameStatusInfo {
  status: GameStatus;
  isCheck: boolean;
  isCheckmate: boolean;
  isDraw: boolean;
  isGameOver: boolean;
  winner: Color | 'draw' | null;
  description: string;
}

export interface MoveResult {
  success: boolean;
  move?: Move;
  reason?: string;
}

export interface MovePair {
  moveNumber: number;
  white: string;
  black?: string;
}

export interface BoardPiece {
  square: Square;
  type: PieceSymbol;
  color: Color;
}

export interface LastMove {
  from: Square;
  to: Square;
}

export interface PendingPromotion {
  from: Square;
  to: Square;
}
