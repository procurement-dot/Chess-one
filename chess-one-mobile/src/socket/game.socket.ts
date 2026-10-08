import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '../services/apiClient';
import { authStore } from '../store/authStore';
import { gameStore } from '../store/gameStore';
import { gameService } from '../services/game.service';
import { PlayerColor, GameResult } from '../types/game.types';

class GameSocketManager {
  private socket: Socket | null = null;
  private currentGameId: number | string | null = null;
  private isReconnecting = false;

  /**
   * Connect to backend Socket.IO server with authentication
   */
  connect(): Socket {
    if (this.socket) {
      if (this.socket.connected) {
        gameStore.setConnectionStatus('connected');
        return this.socket;
      }
      gameStore.setConnectionStatus('connecting');
      this.socket.connect();
      return this.socket;
    }

    let token = authStore.getState().chessOneToken;
    if (!token && typeof window !== 'undefined') {
      token = window.localStorage?.getItem('chess_one_token') || window.sessionStorage?.getItem('chess_one_token');
    }
    const url = getSocketBaseUrl();

    gameStore.setConnectionStatus('connecting');
    this.socket = io(url, {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    this.setupListeners();
    return this.socket;
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', this.socket?.id);
      gameStore.setConnectionStatus('connected');

      // If we were in a game and reconnected, rejoin room and restore authoritative state
      if (this.currentGameId) {
        this.socket?.emit('game:join', { gameId: this.currentGameId });
        this.rejoinGameRoom(this.currentGameId);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      gameStore.setConnectionStatus('disconnected');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      gameStore.setConnectionStatus('connecting');
    });

    this.socket.on('game:joined', (payload) => {
      console.log('[Socket] Confirmed joined game room:', payload);
      gameStore.setConnectionStatus('connected');
    });

    // Match activated / started
    this.socket.on('game:started', (payload) => {
      console.log('[Socket] Match started:', payload);
      if (payload) {
        gameStore.updateGameState({
          status: 'ACTIVE',
          fen: payload.fen,
          currentTurn: payload.currentTurn,
        });
      }
    });

    // Real-time opponent/server chess move
    this.socket.on('game:move', (payload: any) => {
      if (!payload) return;

      const m = payload.move || {};
      const from = payload.from || m.from;
      const to = payload.to || m.to;
      const promotion = payload.promotion || m.promotion;
      const san = payload.san || m.san || '';
      const fen = payload.fen || m.fenAfter || payload.fenAfter;
      const nextTurn = (payload.nextTurn || payload.currentTurn) as PlayerColor;
      const moveNumber = payload.moveNumber || m.moveNumber;
      const color = (payload.color || m.color) as PlayerColor;

      console.log('[Socket] Real-time move received:', san, 'from:', from, 'to:', to);

      gameStore.applyLiveMove({
        from,
        to,
        promotion,
        san,
        fen,
        nextTurn,
        whiteTimeMs: payload.whiteTimeMs,
        blackTimeMs: payload.blackTimeMs,
        moveNumber,
        color,
      });

      // Check if move concluded the game (checkmate / draw)
      if (payload.status === 'COMPLETED' || payload.result) {
        gameStore.setGameFinished(payload.result as GameResult, payload.winnerId);
      }
    });

    // Authoritative clock sync
    this.socket.on('game:clock', (payload) => {
      if (payload && payload.whiteTimeMs !== undefined && payload.blackTimeMs !== undefined) {
        gameStore.updateClocks(payload.whiteTimeMs, payload.blackTimeMs);
      }
    });

    // Draw offer events
    this.socket.on('game:draw-offered', (payload) => {
      console.log('[Socket] Draw offered by:', payload?.offeredByColor);
      gameStore.setDrawOffer(payload?.offeredByColor as PlayerColor);
    });

    this.socket.on('game:draw-accepted', () => {
      console.log('[Socket] Draw accepted');
      gameStore.setGameFinished('DRAW', null);
    });

    this.socket.on('game:draw-rejected', () => {
      console.log('[Socket] Draw rejected by opponent');
      gameStore.setDrawOffer(null);
    });

    // Resignation
    this.socket.on('game:resigned', (payload) => {
      console.log('[Socket] Player resigned:', payload);
      gameStore.setGameFinished('RESIGNATION', payload?.winnerId);
    });

    // Game finished
    this.socket.on('game:finished', (payload) => {
      console.log('[Socket] Game finished:', payload);
      if (payload) {
        gameStore.setGameFinished(payload.result as GameResult, payload.winnerId);
      }
    });

    // Game cancelled
    this.socket.on('game:cancelled', () => {
      console.log('[Socket] Game cancelled');
      gameStore.updateGameState({ status: 'CANCELLED' });
    });

    // Player connection status indicators
    this.socket.on('game:player-disconnected', (payload) => {
      console.log('[Socket] Opponent disconnected:', payload);
    });

    this.socket.on('game:player-reconnected', (payload) => {
      console.log('[Socket] Opponent reconnected:', payload);
    });
  }

  /**
   * Join a specific live game room
   */
  joinGame(gameId: number | string) {
    this.currentGameId = gameId;
    const socket = this.connect();

    if (socket.connected) {
      gameStore.setConnectionStatus('connected');
      socket.emit('game:join', { gameId });
      console.log('[Socket] Joined game room immediately:', gameId);
    } else {
      gameStore.setConnectionStatus('connecting');
      socket.once('connect', () => {
        gameStore.setConnectionStatus('connected');
        socket.emit('game:join', { gameId });
        console.log('[Socket] Joined game room upon connection:', gameId);
      });
    }
  }

  /**
   * Leave a specific live game room
   */
  leaveGame(gameId: number | string) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('game:leave', { gameId });
    }
    if (this.currentGameId === gameId) {
      this.currentGameId = null;
    }
  }

  /**
   * Reconnect recovery: rejoin game room and refresh authoritative state from REST
   */
  private async rejoinGameRoom(gameId: number | string) {
    if (this.isReconnecting) return;
    this.isReconnecting = true;

    try {
      this.socket?.emit('game:join', { gameId });
      console.log('[Socket] Rejoining game after reconnect:', gameId);

      // Re-fetch authoritative game state
      const state = await gameService.getGameState(gameId);
      if (state) {
        gameStore.updateGameState(state);
      }
    } catch (err) {
      console.warn('[Socket] Failed to restore game state after reconnect:', err);
    } finally {
      this.isReconnecting = false;
    }
  }

  /**
   * Disconnect socket cleanly
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentGameId = null;
    gameStore.setConnectionStatus('disconnected');
  }

  onGameStarted(callback: (payload: any) => void): () => void {
    const socket = this.connect();
    socket.on('game:started', callback);
    return () => {
      socket.off('game:started', callback);
    };
  }

  onOnlineUsersUpdate(callback: (onlineUserIds: number[]) => void): () => void {
    const socket = this.connect();
    const handler = (payload: { onlineUserIds: number[] }) => {
      if (payload?.onlineUserIds) {
        callback(payload.onlineUserIds);
      }
    };
    socket.on('users:online-update', handler);
    return () => {
      socket.off('users:online-update', handler);
    };
  }

  onInvitationReceived(callback: (invitation: any) => void): () => void {
    const socket = this.connect();
    socket.on('invitation:received', callback);
    return () => {
      socket.off('invitation:received', callback);
    };
  }

  onInvitationDeclined(callback: (payload: any) => void): () => void {
    const socket = this.connect();
    socket.on('invitation:declined', callback);
    return () => {
      socket.off('invitation:declined', callback);
    };
  }

  sendChatMessage(
    gameId: number | string,
    text: string,
    senderId?: number | string | null,
    senderName?: string
  ) {
    const socket = this.connect();
    socket.emit('game:chat', { gameId, text, senderId, senderName });
  }

  onChatMessage(callback: (message: any) => void): () => void {
    const socket = this.connect();
    socket.on('game:chat-message', callback);
    return () => {
      socket.off('game:chat-message', callback);
    };
  }

  abortGameSocket(gameId: number | string, reason: string = 'FIRST_MOVE_TIMEOUT') {
    const socket = this.connect();
    socket.emit('game:abort', { gameId, reason });
  }

  onGameAborted(callback: (payload: any) => void): () => void {
    const socket = this.connect();
    socket.on('game:aborted', callback);
    return () => {
      socket.off('game:aborted', callback);
    };
  }

  onPlayerDisconnected(callback: (payload: any) => void): () => void {
    const socket = this.connect();
    socket.on('game:player-disconnected', callback);
    return () => {
      socket.off('game:player-disconnected', callback);
    };
  }

  onPlayerReconnected(callback: (payload: any) => void): () => void {
    const socket = this.connect();
    socket.on('game:player-reconnected', callback);
    return () => {
      socket.off('game:player-reconnected', callback);
    };
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const gameSocket = new GameSocketManager();
