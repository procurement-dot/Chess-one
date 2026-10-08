import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Chess, Square } from 'chess.js';
import { gameStore, useGameStore } from '../store/gameStore';
import { authStore, useAuthStore } from '../store/authStore';
import { gameService } from '../services/game.service';
import { gameSocket } from '../socket/game.socket';
import { PlayerColor } from '../types/game.types';

export function useGame(gameId: number | string) {
  const store = useGameStore();
  const { user } = useAuthStore();

  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [pendingPromotion, setPendingPromotion] = useState<{
    from: Square;
    to: Square;
  } | null>(null);
  const [isSubmittingMove, setIsSubmittingMove] = useState(false);

  // Authoritative local chess.js instance synced with store.fen
  const chessRef = useRef<Chess>(new Chess());
  const isSubmittingMoveRef = useRef(false);
  const movesCountRef = useRef(0);

  useEffect(() => {
    movesCountRef.current = store.moves.length;
  }, [store.moves.length]);

  // Sync chess.js instance whenever FEN updates in the store, and clear ghost selections
  useEffect(() => {
    try {
      if (store.fen) {
        chessRef.current.load(store.fen);
      }
    } catch (err) {
      console.warn('[useGame] Failed to load FEN into chess.js:', err);
    }
    // Clear any previous selection / dots whenever board position updates
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);
  }, [store.fen]);

  // Initial load of game metadata, initial state, and moves
  useEffect(() => {
    if (!gameId) return;

    let isMounted = true;
    // Always clear out any prior completed game data
    gameStore.reset();
    gameStore.setLoading(true);

    async function loadInitialData() {
      try {
        const [gameData, stateData, movesData] = await Promise.all([
          gameService.getGame(gameId),
          gameService.getGameState(gameId),
          gameService.getMoves(gameId).catch(() => []),
        ]);

        if (!isMounted) return;

        gameStore.setGame(gameData);
        gameStore.updateGameState(stateData);
        if (movesData.length > 0) {
          gameStore.setMoves(movesData);
        }

        // Connect socket and join game room
        gameSocket.joinGame(gameId);
      } catch (err: any) {
        if (!isMounted) return;
        const msg = err.userFriendlyMessage || err.message || 'Unable to load game data';
        gameStore.setError(msg);
      } finally {
        if (isMounted) {
          gameStore.setLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
      gameSocket.leaveGame(gameId);
      gameStore.reset();
    };
  }, [gameId]);

  // Active clock countdown interval
  useEffect(() => {
    if (store.gameStatus !== 'ACTIVE') return;

    const timer = setInterval(() => {
      gameStore.tickActiveClock(1000);
    }, 1000);

    return () => clearInterval(timer);
  }, [store.gameStatus, store.currentTurn]);

  // Authoritative polling fallback: syncs state reliably without stale closures
  useEffect(() => {
    if (!gameId || store.gameStatus !== 'ACTIVE') return;

    let isPolling = false;

    const interval = setInterval(async () => {
      if (isPolling || isSubmittingMoveRef.current) return;
      const live = gameStore.getState();
      if (live.gameStatus !== 'ACTIVE') return;

      isPolling = true;
      try {
        const state = await gameService.getGameState(gameId);
        if (state && !isSubmittingMoveRef.current) {
          // If match finished/cancelled on server, immediately apply
          if (state.status === 'COMPLETED' || state.status === 'CANCELLED') {
            gameStore.updateGameState(state);
            return;
          }

          const current = gameStore.getState();
          // If turn or FEN differs, verify server has at least as many moves before applying
          if (state.fen !== current.fen || state.currentTurn !== current.currentTurn) {
            const moves = await gameService.getMoves(gameId).catch(() => []);
            const fresh = gameStore.getState();
            if (!isSubmittingMoveRef.current && moves && moves.length >= fresh.moves.length) {
              console.log('[useGame] Background sync detected authoritative update');
              gameStore.updateGameState(state);
              if (moves.length > 0) {
                gameStore.setMoves(moves);
              }
            }
          }
        }
      } catch (err) {
        // Silent catch for background polling
      } finally {
        isPolling = false;
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [gameId, store.gameStatus]);

  // Synchronize timeout state with backend
  useEffect(() => {
    if (store.gameStatus === 'COMPLETED' && store.result === 'TIMEOUT' && gameId) {
      gameService.getGameState(gameId).catch(() => {});
    }
  }, [store.gameStatus, store.result, gameId]);

  // Determine player color perspective ('WHITE' or 'BLACK')
  const { userColor, currentUserId } = useMemo<{ userColor: PlayerColor | null; currentUserId: number | null }>(() => {
    const game = store.currentGame;
    if (!game) return { userColor: 'WHITE', currentUserId: null };

    // 1. Check tab-isolated explicit game color in sessionStorage (useful for multi-tab testing)
    let sessionColor: PlayerColor | null = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = window.sessionStorage.getItem(`chess_game_color_${gameId}`);
        if (stored === 'WHITE' || stored === 'BLACK') {
          sessionColor = stored;
        }
      }
    } catch {}

    // 2. Decode token to extract authoritative numeric database userId and email
    const token = authStore.getState().chessOneToken;
    let jwtUserId: number | null = null;
    let jwtEmail: string | null = null;
    if (token) {
      try {
        const parts = token.split('.');
        if (parts.length >= 2) {
          const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          const json = typeof atob === 'function' ? atob(b64) : '';
          if (json) {
            const payload = JSON.parse(json);
            const id = payload.userId || payload.id;
            if (id) jwtUserId = parseInt(String(id), 10);
            if (payload.email) jwtEmail = String(payload.email).toLowerCase().trim();
          }
        }
      } catch {}
    }

    const currentAuthUser = authStore.getState().user || user;
    const currentAuthId = currentAuthUser?.id ? parseInt(String(currentAuthUser.id), 10) : null;
    const userEmail = (currentAuthUser?.email || jwtEmail || '').toLowerCase().trim();
    const userName = (currentAuthUser?.name || '').toLowerCase().trim();
    const activeId = jwtUserId || currentAuthId;

    // Check White match (ID, Email, or Name)
    const whiteIdMatches = Boolean(
      (activeId && game.whitePlayerId && game.whitePlayerId === activeId) ||
      (activeId && game.whitePlayer?.id && game.whitePlayer.id === activeId)
    );
    const whiteEmailMatches = Boolean(
      userEmail && game.whitePlayer?.email && game.whitePlayer.email.toLowerCase().trim() === userEmail
    );
    const whiteNameMatches = Boolean(
      userName && game.whitePlayer?.name && game.whitePlayer.name.toLowerCase().trim() === userName
    );
    const isWhite = whiteIdMatches || whiteEmailMatches || whiteNameMatches;

    // Check Black match (ID, Email, or Name)
    const blackIdMatches = Boolean(
      (activeId && game.blackPlayerId && game.blackPlayerId === activeId) ||
      (activeId && game.blackPlayer?.id && game.blackPlayer.id === activeId)
    );
    const blackEmailMatches = Boolean(
      userEmail && game.blackPlayer?.email && game.blackPlayer.email.toLowerCase().trim() === userEmail
    );
    const blackNameMatches = Boolean(
      userName && game.blackPlayer?.name && game.blackPlayer.name.toLowerCase().trim() === userName
    );
    const isBlack = blackIdMatches || blackEmailMatches || blackNameMatches;

    if (isBlack && !isWhite) return { userColor: 'BLACK', currentUserId: activeId };
    if (isWhite && !isBlack) return { userColor: 'WHITE', currentUserId: activeId };

    // If both match or neither match, use tab's explicit session color if available
    if (sessionColor) {
      return { userColor: sessionColor, currentUserId: activeId };
    }

    // In PLAYER_VS_AI, one slot is null for the AI engine
    if (game.gameType === 'PLAYER_VS_AI') {
      if (!game.whitePlayer && !game.whitePlayerId) return { userColor: 'BLACK', currentUserId: activeId };
      if (!game.blackPlayer && !game.blackPlayerId) return { userColor: 'WHITE', currentUserId: activeId };
    }

    if (game.blackPlayerId && !game.whitePlayerId) return { userColor: 'BLACK', currentUserId: activeId };
    return { userColor: 'WHITE', currentUserId: activeId };
  }, [store.currentGame, user, gameId]);

  const boardOrientation: 'w' | 'b' = userColor === 'BLACK' ? 'b' : 'w';

  // Is it currently this player's turn?
  const isMyTurn = useMemo(() => {
    if (store.gameStatus !== 'ACTIVE') return false;
    return store.currentTurn === userColor;
  }, [store.gameStatus, store.currentTurn, userColor]);

  // In check square
  const inCheckSquare = useMemo<Square | null>(() => {
    const chess = chessRef.current;
    if (!chess.isCheck()) return null;

    const turn = chess.turn();
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === turn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const rank = 8 - r;
          return `${files[c]}${rank}` as Square;
        }
      }
    }
    return null;
  }, [store.fen]);

  // Handle board square click
  const handleSquarePress = useCallback(
    async (square: Square) => {
      console.log(
        `[useGame] Square pressed: ${square} | myTurn: ${isMyTurn} | myColor: ${userColor} | turn: ${store.currentTurn} | status: ${store.gameStatus}`
      );

      if (store.gameStatus !== 'ACTIVE') {
        console.warn(`[useGame] Cannot move: match status is ${store.gameStatus}`);
        return;
      }

      if (!isMyTurn) {
        console.warn(
          `[useGame] Cannot move: not your turn (your color: ${userColor}, active turn: ${store.currentTurn})`
        );
        return;
      }

      if (isSubmittingMove) {
        console.warn('[useGame] Move is already submitting, please wait');
        return;
      }

      const chess = chessRef.current;
      // Ensure local chess.js is strictly synchronized with store.fen
      if (store.fen && chess.fen() !== store.fen) {
        try {
          chess.load(store.fen);
        } catch {}
      }

      // 1. If clicking an already selected square, deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // 2. If a piece was selected and clicking a valid move square
      if (selectedSquare && possibleMoves.includes(square)) {
        // Check if pawn promotion
        const piece = chess.get(selectedSquare);
        const isPromotion =
          piece?.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') ||
            (piece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Execute regular move
        await executeMove(selectedSquare, square);
        return;
      }

      // 3. Otherwise, select own piece if on square
      const piece = chess.get(square);
      const myChessColor = userColor === 'WHITE' ? 'w' : 'b';

      if (piece && piece.color === myChessColor) {
        setSelectedSquare(square);
        const moves = chess.moves({ square, verbose: true });
        setPossibleMoves(moves.map((m) => m.to as Square));
      } else {
        setSelectedSquare(null);
        setPossibleMoves([]);
      }
    },
    [selectedSquare, possibleMoves, store.gameStatus, isMyTurn, isSubmittingMove, userColor]
  );

  // Dispatch move with optimistic local execution (0ms instant response)
  const executeMove = async (from: Square, to: Square, promotion?: string) => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);

    const chess = chessRef.current;
    const previousFen = store.fen;
    const previousTurn = store.currentTurn;
    const previousMoves = [...store.moves];

    // 1. Optimistically execute move on local chess.js instance immediately
    let localMove = null;
    try {
      localMove = chess.move({
        from,
        to,
        promotion: (promotion as any) || 'q',
      });
    } catch (err) {
      console.warn('[useGame] Local move validation failed:', err);
      return;
    }

    if (!localMove) return;

    // 2. Immediately update the UI store with the new board position (0ms latency!)
    const optimisticFen = chess.fen();
    const nextTurn: PlayerColor = chess.turn() === 'w' ? 'WHITE' : 'BLACK';
    const moveColor: PlayerColor = localMove.color === 'w' ? 'WHITE' : 'BLACK';

    gameStore.applyLiveMove({
      from,
      to,
      promotion,
      san: localMove.san,
      fen: optimisticFen,
      nextTurn,
      color: moveColor,
    });

    setIsSubmittingMove(true);
    isSubmittingMoveRef.current = true;

    // 3. Send move to backend in background
    try {
      const response = await gameService.makeMove(gameId, {
        from,
        to,
        promotion,
      });

      // Synchronize authoritative clocks & verified status
      if (response) {
        if (response.whiteTimeMs !== undefined && response.blackTimeMs !== undefined) {
          gameStore.updateClocks(response.whiteTimeMs, response.blackTimeMs);
        }
        if (response.status === 'COMPLETED' || response.result) {
          gameStore.setGameFinished(response.result!, response.winnerId ?? null);
        }
      }

      // If playing vs AI, single safe fallback poll for the AI's counter-move (scheduled in 400ms on server)
      if (store.currentGame?.gameType === 'PLAYER_VS_AI') {
        const fetchAiMove = async () => {
          const live = gameStore.getState();
          if (live.gameStatus === 'ACTIVE' && live.currentTurn !== userColor) {
            try {
              const state = await gameService.getGameState(gameId);
              const currentLive = gameStore.getState();
              if (state && state.fen !== currentLive.fen && currentLive.currentTurn !== userColor) {
                const moves = await gameService.getMoves(gameId).catch(() => []);
                gameStore.updateGameState(state);
                if (moves && moves.length > 0) {
                  gameStore.setMoves(moves);
                }
              }
            } catch {}
          }
        };
        setTimeout(fetchAiMove, 800);
      }
    } catch (err: any) {
      console.warn('[useGame] Move rejected by server, rolling back:', err);
      // Revert optimistic move on failure
      chess.load(previousFen);
      gameStore.updateGameState({
        fen: previousFen,
        currentTurn: previousTurn,
      });
      gameStore.setMoves(previousMoves);
    } finally {
      setIsSubmittingMove(false);
      setTimeout(() => {
        isSubmittingMoveRef.current = false;
      }, 400);
    }
  };

  const confirmPromotion = (piece: 'q' | 'r' | 'b' | 'n') => {
    if (!pendingPromotion) return;
    executeMove(pendingPromotion.from, pendingPromotion.to, piece);
  };

  const cancelPromotion = () => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  };

  // Actions
  const resign = async () => {
    try {
      await gameService.resignGame(gameId);
    } catch (err: any) {
      console.warn('[useGame] Resign failed:', err);
    }
  };

  const offerDraw = async () => {
    try {
      await gameService.offerDraw(gameId);
    } catch (err: any) {
      console.warn('[useGame] Offer draw failed:', err);
    }
  };

  const acceptDraw = async () => {
    try {
      await gameService.acceptDraw(gameId);
    } catch (err: any) {
      console.warn('[useGame] Accept draw failed:', err);
    }
  };

  const rejectDraw = async () => {
    try {
      await gameService.rejectDraw(gameId);
      gameStore.setDrawOffer(null);
    } catch (err: any) {
      console.warn('[useGame] Reject draw failed:', err);
    }
  };

  return {
    game: store.currentGame,
    status: store.gameStatus,
    fen: store.fen,
    currentTurn: store.currentTurn,
    whiteTimeMs: store.whiteTimeMs,
    blackTimeMs: store.blackTimeMs,
    moves: store.moves,
    lastMove: store.lastMove,
    result: store.result,
    winnerId: store.winnerId,
    drawOfferFrom: store.drawOfferFrom,
    connectionStatus: store.connectionStatus,
    isLoading: store.isLoading,
    error: store.error,
    userColor,
    currentUserId,
    boardOrientation,
    isMyTurn,
    selectedSquare,
    possibleMoves,
    inCheckSquare,
    pendingPromotion,
    handleSquarePress,
    confirmPromotion,
    cancelPromotion,
    resign,
    offerDraw,
    acceptDraw,
    rejectDraw,
  };
}
