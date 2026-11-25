import { io, Socket } from 'socket.io-client';
import { getSocketBaseUrl } from '../services/apiClient';
import { authStore } from '../store/authStore';
import { gameStore } from '../store/gameStore';
import { gameService } from '../services/game.service';
import { PlayerColor, GameResult, GameFinishedPayload, OnlineUser } from '../types/game.types';
import {
  RoundStartedEvent,
  YourGameEvent,
  TournamentUpdatedEvent,
} from '../types/tournament.types';

class GameSocketManager {
  private socket: Socket | null = null;
  private currentGameId: number | string | null = null;
  private isReconnecting = false;
  private joinedTournamentIds = new Set<number | string>();
  private listenerRegistry = new Map<string, Set<Function>>();
  private reconnectedCallbacks = new Set<() => void>();
  private authErrorCallbacks = new Set<(err: any) => void>();
  private presencePingTimer: any = null;

  /**
   * Connect to backend Socket.IO server with authentication.
   * Exactly ONE Socket instance exists for the app lifetime until explicit logout.
   */
  connect(): Socket {
    // If socket already exists (connecting, connected, or disconnected), never create a duplicate!
    if (this.socket) {
      if (this.socket.disconnected) {
        gameStore.setConnectionStatus('connecting');
        this.socket.connect();
      }
      return this.socket;
    }

    let token = authStore.getState().chessOneToken;
    if (!token && typeof window !== 'undefined') {
      token =
        window.localStorage?.getItem('chess_one_token') ||
        window.sessionStorage?.getItem('chess_one_token');
    }

    const url = getSocketBaseUrl();
    gameStore.setConnectionStatus('connecting');

    this.socket = io(url, {
      auth: { token: token || undefined },
      transports: ['websocket', 'polling'],
      tryAllTransports: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 20000,
    });

    this.setupCoreListeners();
    this.rebindRegistry();
    this.startPresencePing();

    return this.socket;
  }

  /**
   * Ensures socket is active, connected, and authenticated.
   * Safe to call repeatedly on mobile visibility, pageshow, online, or focus events.
   */
  ensureConnected(): Socket {
    const socket = this.connect();

    let token = authStore.getState().chessOneToken;
    if (!token && typeof window !== 'undefined') {
      token =
        window.localStorage?.getItem('chess_one_token') ||
        window.sessionStorage?.getItem('chess_one_token');
    }

    if (token) {
      (socket.auth as any) = { token };
      if (socket.connected) {
        socket.emit('auth:authenticate', { token });
      }
    }

    if (socket.disconnected) {
      gameStore.setConnectionStatus('connecting');
      socket.connect();
    }

    this.startPresencePing();
    return socket;
  }

  /**
   * Dynamically update socket authentication token without destroying the socket instance.
   */
  updateAuth(token?: string | null) {
    let currentToken = token !== undefined ? token : authStore.getState().chessOneToken;
    if (!currentToken && typeof window !== 'undefined') {
      currentToken =
        window.localStorage?.getItem('chess_one_token') ||
        window.sessionStorage?.getItem('chess_one_token');
    }

    if (!currentToken) {
      this.disconnect();
      return;
    }

    if (this.socket) {
      const prevToken = (this.socket.auth as any)?.token;
      this.socket.auth = { token: currentToken };

      if (this.socket.connected) {
        if (prevToken !== currentToken) {
          this.socket.emit('auth:authenticate', { token: currentToken });
        }
      } else {
        gameStore.setConnectionStatus('connecting');
        this.socket.connect();
      }
    } else {
      this.connect();
    }
  }

  /**
   * Register a persistent event handler in the listener registry.
   * Handlers automatically survive socket reconnects and socket recreation.
   */
  private registerHandler(event: string, handler: Function): () => void {
    if (!this.listenerRegistry.has(event)) {
      this.listenerRegistry.set(event, new Set());
    }
    this.listenerRegistry.get(event)!.add(handler);

    if (this.socket) {
      this.socket.on(event, handler as any);
    }

    return () => {
      const set = this.listenerRegistry.get(event);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.listenerRegistry.delete(event);
        }
      }
      if (this.socket) {
        this.socket.off(event, handler as any);
      }
    };
  }

  /**
   * Rebind all registered event listeners to the active socket instance.
   */
  private rebindRegistry() {
    if (!this.socket) return;
    for (const [event, handlers] of this.listenerRegistry.entries()) {
      for (const h of handlers) {
        this.socket.off(event, h as any);
        this.socket.on(event, h as any);
      }
    }
  }

  private setupCoreListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', this.socket?.id);
      gameStore.setConnectionStatus('connected');

      let token = authStore.getState().chessOneToken;
      if (!token && typeof window !== 'undefined') {
        token =
          window.localStorage?.getItem('chess_one_token') ||
          window.sessionStorage?.getItem('chess_one_token');
      }

      if (token) {
        this.socket?.emit('auth:authenticate', { token });
      }

      // Notify reconnected subscribers to trigger refetch
      this.reconnectedCallbacks.forEach((cb) => {
        try {
          cb();
        } catch (e) {
          console.warn('[Socket] Reconnect callback error:', e);
        }
      });

      // If we were in a game and reconnected, rejoin room and restore authoritative state
      if (this.currentGameId) {
        this.socket?.emit('game:join', { gameId: this.currentGameId });
        this.rejoinGameRoom(this.currentGameId);
      }

      // Rejoin any active tournament rooms
      for (const tid of this.joinedTournamentIds) {
        this.socket?.emit('tournament:join', { tournamentId: tid });
      }
    });

    this.socket.on('auth:authenticated', (payload: any) => {
      console.log('[Socket] Authenticated successfully as user:', payload?.user?.id);
      gameStore.setConnectionStatus('authenticated');
    });

    this.socket.on('auth:error', (payload: any) => {
      console.warn('[Socket] Auth error received:', payload);
      gameStore.setConnectionStatus('auth_error');
      this.authErrorCallbacks.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.warn('[Socket] Auth error callback error:', e);
        }
      });
    });

    this.socket.on('presence:pong', (payload: any) => {
      if (payload?.onlineUserIds) {
        const handlers = this.listenerRegistry.get('users:online-update');
        if (handlers) {
          handlers.forEach((h) => {
            try {
              h(payload);
            } catch (err) {
              console.warn('[Socket] Error in online-update listener from pong:', err);
            }
          });
        }
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected:', reason);
      gameStore.setConnectionStatus('offline');
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
      gameStore.setConnectionStatus('connecting');
    });

    this.socket.on('game:joined', (payload) => {
      console.log('[Socket] Confirmed joined game room:', payload);
      if (payload && (payload.whitePlayer || payload.blackPlayer)) {
        gameStore.updateGamePlayers({
          whitePlayer: payload.whitePlayer,
          blackPlayer: payload.blackPlayer,
        });
      }
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
        if (payload.whitePlayer || payload.blackPlayer) {
          gameStore.updateGamePlayers({
            whitePlayer: payload.whitePlayer,
            blackPlayer: payload.blackPlayer,
          });
        }
      }
    });

    // Synchronize real-time player profiles
    this.socket.on('game:players-updated', (payload: any) => {
      console.log('[Socket] Players updated dynamically:', payload);
      if (payload && (payload.whitePlayer || payload.blackPlayer)) {
        gameStore.updateGamePlayers({
          whitePlayer: payload.whitePlayer,
          blackPlayer: payload.blackPlayer,
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
    this.socket.on('game:finished', (payload: GameFinishedPayload) => {
      console.log('[Socket] Game finished:', payload);
      if (payload) {
        gameStore.setGameFinished(payload.result as GameResult, payload.winnerId ?? null, {
          whiteRatingChange: payload.whiteRatingChange,
          blackRatingChange: payload.blackRatingChange,
          whiteRating: payload.whiteRating,
          blackRating: payload.blackRating,
        });
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
   * Periodic presence heartbeat ping every 20s while the page is active.
   */
  startPresencePing() {
    if (this.presencePingTimer) return;
    this.presencePingTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return; // Pause pings while backgrounded
      }
      if (this.socket && this.socket.connected) {
        this.socket.emit('presence:ping');
      }
    }, 20000);
  }

  stopPresencePing() {
    if (this.presencePingTimer) {
      clearInterval(this.presencePingTimer);
      this.presencePingTimer = null;
    }
  }

  /**
   * Join a specific live game room
   */
  joinGame(gameId: number | string) {
    this.currentGameId = gameId;
    const socket = this.ensureConnected();
    const user = authStore.getState().user;
    let color: string | null = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      color = window.sessionStorage.getItem(`chess_game_color_${gameId}`);
    }
    const payload = { gameId, user, color };

    if (socket.connected) {
      socket.emit('game:join', payload);
      console.log('[Socket] Joined game room immediately with profile:', gameId, user?.name);
    } else {
      socket.once('connect', () => {
        socket.emit('game:join', payload);
        console.log('[Socket] Joined game room upon connection with profile:', gameId, user?.name);
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
   * Disconnect socket cleanly on explicit logout.
   */
  disconnect() {
    this.stopPresencePing();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.currentGameId = null;
    gameStore.setConnectionStatus('offline');
  }

  onReconnected(callback: () => void): () => void {
    this.reconnectedCallbacks.add(callback);
    return () => {
      this.reconnectedCallbacks.delete(callback);
    };
  }

  onAuthError(callback: (err: any) => void): () => void {
    this.authErrorCallbacks.add(callback);
    return () => {
      this.authErrorCallbacks.delete(callback);
    };
  }

  onGameStarted(callback: (payload: any) => void): () => void {
    this.connect();
    return this.registerHandler('game:started', callback);
  }

  onGameFinished(callback: (payload: GameFinishedPayload) => void): () => void {
    this.connect();
    return this.registerHandler('game:finished', callback);
  }

  onOnlineUsersUpdate(
    callback: (onlineUserIds: number[], onlineUsers?: OnlineUser[]) => void
  ): () => void {
    this.connect();
    const handler = (payload: { onlineUserIds: number[]; onlineUsers?: OnlineUser[] }) => {
      if (payload?.onlineUserIds) {
        callback(payload.onlineUserIds, payload.onlineUsers);
      }
    };
    return this.registerHandler('users:online-update', handler);
  }

  onInvitationReceived(callback: (invitation: any) => void): () => void {
    this.connect();
    return this.registerHandler('invitation:received', callback);
  }

  onInvitationDeclined(callback: (payload: any) => void): () => void {
    this.connect();
    return this.registerHandler('invitation:declined', callback);
  }

  sendMove(
    gameId: number | string,
    move: { from: string; to: string; promotion?: string }
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const socket = this.ensureConnected();
      if (!socket || !socket.connected) {
        reject(new Error('Socket not connected'));
        return;
      }
      socket.emit('game:move', { gameId, ...move }, (res: any) => {
        if (res && res.error) {
          reject(new Error(res.error));
        } else {
          resolve(res?.result);
        }
      });
    });
  }

  sendChatMessage(
    gameId: number | string,
    text: string,
    senderId?: number | string | null,
    senderName?: string
  ) {
    const socket = this.ensureConnected();
    socket.emit('game:chat', { gameId, text, senderId, senderName });
  }

  onChatMessage(callback: (message: any) => void): () => void {
    this.connect();
    return this.registerHandler('game:chat-message', callback);
  }

  abortGameSocket(gameId: number | string, reason: string = 'FIRST_MOVE_TIMEOUT') {
    const socket = this.ensureConnected();
    socket.emit('game:abort', { gameId, reason });
  }

  onGameAborted(callback: (payload: any) => void): () => void {
    this.connect();
    return this.registerHandler('game:aborted', callback);
  }

  onPlayerDisconnected(callback: (payload: any) => void): () => void {
    this.connect();
    return this.registerHandler('game:player-disconnected', callback);
  }

  onPlayerReconnected(callback: (payload: any) => void): () => void {
    this.connect();
    return this.registerHandler('game:player-reconnected', callback);
  }

  joinTournament(tournamentId: number | string) {
    this.joinedTournamentIds.add(tournamentId);
    const socket = this.ensureConnected();
    socket.emit('tournament:join', { tournamentId });
  }

  leaveTournament(tournamentId: number | string) {
    this.joinedTournamentIds.delete(tournamentId);
    if (this.socket && this.socket.connected) {
      this.socket.emit('tournament:leave', { tournamentId });
    }
  }

  onRoundStarted(callback: (event: RoundStartedEvent) => void): () => void {
    this.connect();
    return this.registerHandler('tournament:round-started', callback);
  }

  onYourGame(callback: (event: YourGameEvent) => void): () => void {
    this.connect();
    return this.registerHandler('tournament:your-game', callback);
  }

  onTournamentUpdated(callback: (event: TournamentUpdatedEvent) => void): () => void {
    this.connect();
    return this.registerHandler('tournament:updated', callback);
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  getDebugInfo() {
    const engine: any = (this.socket as any)?.io?.engine;
    return {
      baseUrl: getSocketBaseUrl(),
      socketId: this.socket?.id || null,
      transport: engine?.transport?.name || (this.socket?.connected ? 'connected' : 'none'),
      connected: !!this.socket?.connected,
      connectionStatus: gameStore.getState().connectionStatus,
    };
  }
}

export const gameSocket = new GameSocketManager();

// Automatically keep socket authentication in sync with authStore
authStore.subscribe(() => {
  const token = authStore.getState().chessOneToken;
  gameSocket.updateAuth(token);
});
