import { useSyncExternalStore } from 'react';
import {
  Game,
  GameState,
  GameMove,
  GameStatus,
  GameResult,
  PlayerColor,
} from '../types/game.types';

export interface LiveGameState {
  currentGame: Game | null;
  gameState: GameState | null;
  fen: string;
  currentTurn: PlayerColor;
  whiteTimeMs: number | null;
  blackTimeMs: number | null;
  moves: GameMove[];
  gameStatus: GameStatus;
  result: GameResult | null;
  winnerId: number | null;
  drawOfferFrom: PlayerColor | null;
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  lastMove: { from: string; to: string } | null;
  isLoading: boolean;
  error: string | null;
}

const DEFAULT_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

const initialState: LiveGameState = {
  currentGame: null,
  gameState: null,
  fen: DEFAULT_FEN,
  currentTurn: 'WHITE',
  whiteTimeMs: null,
  blackTimeMs: null,
  moves: [],
  gameStatus: 'WAITING',
  result: null,
  winnerId: null,
  drawOfferFrom: null,
  connectionStatus: 'disconnected',
  lastMove: null,
  isLoading: false,
  error: null,
};

type Listener = () => void;

class GameStore {
  private state: LiveGameState = { ...initialState };
  private listeners: Set<Listener> = new Set();

  getState(): LiveGameState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  setLoading(isLoading: boolean) {
    this.state = { ...this.state, isLoading };
    this.notify();
  }

  setError(error: string | null) {
    this.state = { ...this.state, error, isLoading: false };
    this.notify();
  }

  setGame(game: Game) {
    const resolvedId = (game as any)?.id || (game as any)?.gameId;
    const normalizedGame: Game = {
      ...game,
      id: resolvedId,
      whitePlayerId: game.whitePlayerId ?? (game.whitePlayer?.id as any) ?? null,
      blackPlayerId: game.blackPlayerId ?? (game.blackPlayer?.id as any) ?? null,
    };

    this.state = {
      ...this.state,
      currentGame: normalizedGame,
      gameStatus: normalizedGame.status || this.state.gameStatus,
      fen: normalizedGame.fen || this.state.fen || DEFAULT_FEN,
      currentTurn: normalizedGame.currentTurn || this.state.currentTurn || 'WHITE',
      whiteTimeMs: normalizedGame.whiteTimeMs ?? this.state.whiteTimeMs,
      blackTimeMs: normalizedGame.blackTimeMs ?? this.state.blackTimeMs,
      result: normalizedGame.result ?? this.state.result,
      winnerId: normalizedGame.winnerId ?? this.state.winnerId,
      drawOfferFrom: normalizedGame.drawOfferFrom ?? this.state.drawOfferFrom,
      moves: (normalizedGame.moves && normalizedGame.moves.length > 0) ? normalizedGame.moves : this.state.moves,
      isLoading: false,
      error: null,
    };
    this.notify();
  }

  updateGameState(state: Partial<GameState>) {
    this.state = {
      ...this.state,
      gameState: { ...(this.state.gameState as any), ...state },
      fen: (state.fen && typeof state.fen === 'string' && state.fen.trim().length > 0)
        ? state.fen
        : (this.state.fen || DEFAULT_FEN),
      currentTurn: state.currentTurn ?? this.state.currentTurn,
      whiteTimeMs: state.whiteTimeMs !== undefined ? state.whiteTimeMs : this.state.whiteTimeMs,
      blackTimeMs: state.blackTimeMs !== undefined ? state.blackTimeMs : this.state.blackTimeMs,
      gameStatus: state.status ?? this.state.gameStatus,
      result: state.result !== undefined ? state.result : this.state.result,
      winnerId: state.winnerId !== undefined ? state.winnerId : this.state.winnerId,
      drawOfferFrom: state.drawOfferFrom !== undefined ? state.drawOfferFrom : this.state.drawOfferFrom,
      currentGame: this.state.currentGame
        ? {
            ...this.state.currentGame,
            ...(state.status ? { status: state.status } : {}),
            ...(state.currentTurn ? { currentTurn: state.currentTurn } : {}),
            ...(state.fen ? { fen: state.fen } : {}),
            ...(state.result !== undefined ? { result: state.result } : {}),
            ...(state.winnerId !== undefined ? { winnerId: state.winnerId } : {}),
            ...(state.whiteTimeMs !== undefined ? { whiteTimeMs: state.whiteTimeMs } : {}),
            ...(state.blackTimeMs !== undefined ? { blackTimeMs: state.blackTimeMs } : {}),
            ...(state.drawOfferFrom !== undefined ? { drawOfferFrom: state.drawOfferFrom } : {}),
          }
        : null,
    };
    this.notify();
  }

  setMoves(moves: GameMove[]) {
    const last = moves.length > 0 ? moves[moves.length - 1] : null;
    this.state = {
      ...this.state,
      moves,
      lastMove: last ? { from: last.from, to: last.to } : null,
    };
    this.notify();
  }

  applyLiveMove(move: {
    from?: string;
    to?: string;
    promotion?: string | null;
    san?: string;
    fen?: string;
    nextTurn?: PlayerColor;
    whiteTimeMs?: number | null;
    blackTimeMs?: number | null;
    moveNumber?: number;
    color?: PlayerColor;
  }) {
    const fen = (move.fen && typeof move.fen === 'string' && move.fen.trim().length > 0)
      ? move.fen
      : (this.state.fen || DEFAULT_FEN);

    const currentTurn = move.nextTurn || (this.state.currentTurn === 'WHITE' ? 'BLACK' : 'WHITE');

    // If board position and turn already match (e.g. optimistic move), just sync clocks without re-rendering board
    if (this.state.fen === fen && this.state.currentTurn === currentTurn) {
      this.state = {
        ...this.state,
        whiteTimeMs: move.whiteTimeMs !== undefined && move.whiteTimeMs !== null ? move.whiteTimeMs : this.state.whiteTimeMs,
        blackTimeMs: move.blackTimeMs !== undefined && move.blackTimeMs !== null ? move.blackTimeMs : this.state.blackTimeMs,
      };
      this.notify();
      return;
    }

    const from = move.from || '';
    const to = move.to || '';
    const san = move.san || '';

    const newMoveRecord: GameMove = {
      id: Date.now(),
      gameId: this.state.currentGame?.id || 0,
      moveNumber: move.moveNumber || this.state.moves.length + 1,
      color: move.color || (this.state.currentTurn === 'WHITE' ? 'WHITE' : 'BLACK'),
      from,
      to,
      promotion: move.promotion,
      san,
      fenAfter: fen,
      createdAt: new Date().toISOString(),
    };

    // Prevent duplicate moves if received via both HTTP response and Socket event
    const existingMoves = this.state.moves;
    const isDuplicate = existingMoves.some(
      (m) =>
        m.from === newMoveRecord.from &&
        m.to === newMoveRecord.to &&
        (m.san === newMoveRecord.san || m.moveNumber === newMoveRecord.moveNumber)
    );

    const updatedMoves = isDuplicate ? existingMoves : [...existingMoves, newMoveRecord];

    this.state = {
      ...this.state,
      fen,
      currentTurn,
      lastMove: (from && to) ? { from, to } : this.state.lastMove,
      moves: updatedMoves,
      whiteTimeMs: move.whiteTimeMs !== undefined && move.whiteTimeMs !== null ? move.whiteTimeMs : this.state.whiteTimeMs,
      blackTimeMs: move.blackTimeMs !== undefined && move.blackTimeMs !== null ? move.blackTimeMs : this.state.blackTimeMs,
      drawOfferFrom: null, // Any move clears pending draw offers
      currentGame: this.state.currentGame
        ? {
            ...this.state.currentGame,
            fen,
            currentTurn,
            whiteTimeMs: move.whiteTimeMs !== undefined && move.whiteTimeMs !== null ? move.whiteTimeMs : this.state.currentGame.whiteTimeMs,
            blackTimeMs: move.blackTimeMs !== undefined && move.blackTimeMs !== null ? move.blackTimeMs : this.state.currentGame.blackTimeMs,
          }
        : null,
    };
    this.notify();
  }

  updateClocks(whiteTimeMs: number | null, blackTimeMs: number | null) {
    this.state = {
      ...this.state,
      whiteTimeMs,
      blackTimeMs,
    };
    this.notify();
  }

  tickActiveClock(decrementMs: number = 1000) {
    if (this.state.gameStatus !== 'ACTIVE') return;

    if (this.state.currentTurn === 'WHITE' && this.state.whiteTimeMs !== null) {
      const nextTime = Math.max(0, this.state.whiteTimeMs - decrementMs);
      if (nextTime === 0) {
        // White timed out -> Black wins
        const winnerId = this.state.currentGame?.blackPlayerId ?? null;
        this.state = {
          ...this.state,
          whiteTimeMs: 0,
          gameStatus: 'COMPLETED',
          result: 'TIMEOUT',
          winnerId,
          drawOfferFrom: null,
        };
        this.notify();
        return;
      }
      this.state = { ...this.state, whiteTimeMs: nextTime };
      this.notify();
    } else if (this.state.currentTurn === 'BLACK' && this.state.blackTimeMs !== null) {
      const nextTime = Math.max(0, this.state.blackTimeMs - decrementMs);
      if (nextTime === 0) {
        // Black timed out -> White wins
        const winnerId = this.state.currentGame?.whitePlayerId ?? null;
        this.state = {
          ...this.state,
          blackTimeMs: 0,
          gameStatus: 'COMPLETED',
          result: 'TIMEOUT',
          winnerId,
          drawOfferFrom: null,
        };
        this.notify();
        return;
      }
      this.state = { ...this.state, blackTimeMs: nextTime };
      this.notify();
    }
  }

  setDrawOffer(color: PlayerColor | null) {
    this.state = { ...this.state, drawOfferFrom: color };
    this.notify();
  }

  setGameFinished(result: GameResult, winnerId: number | null) {
    this.state = {
      ...this.state,
      gameStatus: 'COMPLETED',
      result,
      winnerId,
      drawOfferFrom: null,
    };
    this.notify();
  }

  setConnectionStatus(status: 'connected' | 'connecting' | 'disconnected') {
    this.state = { ...this.state, connectionStatus: status };
    this.notify();
  }

  reset() {
    this.state = {
      ...initialState,
      connectionStatus: this.state.connectionStatus,
    };
    this.notify();
  }
}

export const gameStore = new GameStore();

export function useGameStore(): LiveGameState {
  return useSyncExternalStore(
    (callback) => gameStore.subscribe(callback),
    () => gameStore.getState(),
    () => gameStore.getState()
  );
}
