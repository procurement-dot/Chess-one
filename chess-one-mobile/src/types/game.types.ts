/**
 * ChessOne Game API & Live Match Types
 */

export type GameType = 'PLAYER_VS_PLAYER' | 'PLAYER_VS_AI';

export type GameStatus = 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

export type GameResult =
  | 'CHECKMATE'
  | 'RESIGNATION'
  | 'DRAW'
  | 'STALEMATE'
  | 'TIMEOUT';

export type PlayerColor = 'WHITE' | 'BLACK';

export type ColorPreference = 'WHITE' | 'BLACK' | 'RANDOM';

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export type InvitationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface GamePlayer {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
}

export interface GameInvitation {
  id: number;
  gameId: number;
  senderId?: number;
  receiverId?: number;
  status?: InvitationStatus;
  gameCode?: string;
  timeControl?: string;
  createdAt: string;
  expiresAt: string;
  respondedAt?: string | null;
  sender?: GamePlayer;
  receiver?: GamePlayer;
  game?: {
    id: number;
    gameCode: string;
    gameType: GameType;
    timeControl: string;
  };
}

export interface GameMove {
  id: number;
  gameId: number;
  moveNumber: number;
  playerId?: number | null;
  color: PlayerColor;
  from: string;
  to: string;
  promotion?: string | null;
  san: string;
  fenAfter: string;
  createdAt: string;
}

export interface Game {
  id: number;
  gameCode: string;
  gameType: GameType;
  status: GameStatus;
  createdBy: number;
  creator?: GamePlayer;
  whitePlayerId?: number | null;
  whitePlayer?: GamePlayer | null;
  blackPlayerId?: number | null;
  blackPlayer?: GamePlayer | null;
  aiDifficulty?: AIDifficulty | null;
  timeControl: string;
  whiteTimeMs?: number | null;
  blackTimeMs?: number | null;
  fen: string;
  pgn: string;
  currentTurn: PlayerColor;
  result?: GameResult | null;
  winnerId?: number | null;
  winner?: GamePlayer | null;
  drawOfferFrom?: PlayerColor | null;
  lastMoveAt?: string | null;
  createdAt: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  invitations?: GameInvitation[];
  moves?: GameMove[];
}

export interface GameState {
  gameId: number;
  gameCode: string;
  status: GameStatus;
  fen: string;
  currentTurn: PlayerColor;
  whiteTimeMs: number | null;
  blackTimeMs: number | null;
  lastMoveAt?: string | null;
  result?: GameResult | null;
  winnerId?: number | null;
  drawOfferFrom?: PlayerColor | null;
  moveCount?: number;
  lastMoveNumber?: number;
}

export interface CreateGameRequest {
  gameType: GameType;
  timeControl: string;
  colorPreference?: ColorPreference;
  aiDifficulty?: AIDifficulty;
}

export interface CreateGameResponse {
  gameId: number;
  gameCode: string;
  gameType: GameType;
  status: GameStatus;
  playerColor?: PlayerColor;
  timeControl: string;
}

export interface MakeMoveRequest {
  from: string;
  to: string;
  promotion?: string;
  clientTurnElapsedMs?: number;
}

export interface MakeMoveResponse {
  gameId: number;
  gameCode?: string;
  from?: string;
  to?: string;
  san?: string;
  moveNumber: number;
  move: {
    id?: number;
    moveNumber?: number;
    playerId?: number | null;
    color?: PlayerColor;
    from: string;
    to: string;
    promotion?: string | null;
    san: string;
    fenAfter?: string;
  };
  fen: string;
  currentTurn: PlayerColor;
  nextTurn?: PlayerColor;
  whiteTimeMs: number | null;
  blackTimeMs: number | null;
  result?: GameResult | null;
  winnerId?: number | null;
  status: GameStatus;
}

export interface GameResultResponse {
  gameId: number;
  gameCode: string;
  status: GameStatus;
  result: GameResult | null;
  winnerId: number | null;
  winner?: GamePlayer | null;
  finishedAt?: string | null;
  pgn?: string;
}

export interface MyGamesResponse {
  games: Game[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AiBestMove {
  moveNumber: number;
  player: string;
  san: string;
  title: string;
  explanation: string;
}

export interface AiWorstMove {
  moveNumber: number;
  player: string;
  san: string;
  title: string;
  explanation: string;
  betterMove?: string;
}

export interface AiReviewResponse {
  summary: string;
  verdict: string;
  coachRating: string;
  accuracyWhite: number;
  accuracyBlack: number;
  bestMoves: AiBestMove[];
  worstMoves: AiWorstMove[];
  turningPoint: string;
  keyTakeaway: string;
}

export interface OnlineUser {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  isOnline: boolean;
  createdAt?: string;
}

export interface QuickInviteResponse {
  gameId: number;
  gameCode: string;
  invitationId: number;
  opponent: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  timeControl: string;
}

export interface ChatMessage {
  id: string;
  gameId: number | string;
  senderId?: number | string | null;
  senderName: string;
  text: string;
  createdAt: string;
}
