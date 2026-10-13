import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert } from 'react-native';
import { Chess, Square } from 'chess.js';
import { gameStore, useGameStore } from '../store/gameStore';
import { authStore, useAuthStore } from '../store/authStore';
import { gameService } from '../services/game.service';
import { gameSocket } from '../socket/game.socket';
import { localAiService } from '../services/localAi.service';
import { PlayerColor, GameResult } from '../types/game.types';

function checkLocalGameOver(
  chess: Chess,
  lastMoverColor: PlayerColor,
  userColor: PlayerColor | null,
  currentUserId: number | null
): { isOver: boolean; result: GameResult; winnerId: number | null } {
  if (!chess.isGameOver()) {
    return { isOver: false, result: 'DRAW', winnerId: null };
  }

  if (chess.isCheckmate()) {
    // If user played the checkmating move, user wins; if AI played it, AI wins (null)
    const winnerId = lastMoverColor === userColor ? currentUserId : null;
    return { isOver: true, result: 'CHECKMATE', winnerId };
  }

  if (chess.isStalemate()) {
    return { isOver: true, result: 'STALEMATE', winnerId: null };
  }

  if (chess.isThreefoldRepetition() || chess.isInsufficientMaterial() || chess.isDraw()) {
    return { isOver: true, result: 'DRAW', winnerId: null };
  }

  return { isOver: true, result: 'DRAW', winnerId: null };
}

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
  const isSubmittingMoveRef = useRef(false);

  // Authoritative local chess.js instance synced with store.fen
  const chessRef = useRef<Chess>(new Chess());

  // Guards to prevent double-execution, re-initialization, or duplicate AI turns
  const loadedGameIdRef = useRef<string | number | null>(null);
  const isAiThinkingRef = useRef<boolean>(false);
  const lastAiFenProcessedRef = useRef<string | null>(null);
  const turnStartedAtRef = useRef<number>(Date.now());

  // Sync chess.js instance whenever FEN updates in the store
  useEffect(() => {
    try {
      if (store.fen) {
        chessRef.current.load(store.fen);
      }
    } catch (err) {
      console.warn('[useGame] Failed to load FEN into chess.js:', err);
    }
    // Always clear square selection and move dots when board position updates
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);
  }, [store.fen]);

  // Initial load of game metadata, initial state, and moves (strictly once per gameId)
  useEffect(() => {
    if (!gameId) return;
    if (loadedGameIdRef.current === gameId) return;
    loadedGameIdRef.current = gameId;

    let isMounted = true;
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

        gameStore.setGame({
          ...gameData,
          ...stateData,
          whiteTimeMs: stateData?.whiteTimeMs ?? gameData.whiteTimeMs,
          blackTimeMs: stateData?.blackTimeMs ?? gameData.blackTimeMs,
        });
        gameStore.updateGameState(stateData);
        if (movesData && movesData.length > 0) {
          gameStore.setMoves(movesData);
        }

        turnStartedAtRef.current = Date.now();

        // Connect socket and join game room only for PVP matches
        if (gameData.gameType !== 'PLAYER_VS_AI') {
          gameSocket.joinGame(gameId);
        }
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
      loadedGameIdRef.current = null;
      lastAiFenProcessedRef.current = null;
      isAiThinkingRef.current = false;
      if (store.currentGame?.gameType !== 'PLAYER_VS_AI') {
        gameSocket.leaveGame(gameId);
      }
      gameStore.reset();
    };
  }, [gameId]);

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
      if (game.whitePlayerId === null) return { userColor: 'BLACK', currentUserId: activeId };
      if (game.blackPlayerId === null) return { userColor: 'WHITE', currentUserId: activeId };
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

  // Clear selections when game finishes or when it is not player's turn
  useEffect(() => {
    if (store.gameStatus !== 'ACTIVE' || !isMyTurn) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      setPendingPromotion(null);
    }
  }, [store.gameStatus, isMyTurn]);

  // Handle local timeout for AI games
  const handleLocalTimeout = useCallback(
    async (timedOutColor: PlayerColor) => {
      const currentStore = gameStore.getState();
      if (currentStore.gameStatus !== 'ACTIVE') return;

      const aiColor: PlayerColor = userColor === 'WHITE' ? 'BLACK' : 'WHITE';
      const winnerId = timedOutColor === aiColor ? currentUserId : null;

      gameStore.setGameFinished('TIMEOUT', winnerId);
      gameStore.updateClocks(
        timedOutColor === 'WHITE' ? 0 : currentStore.whiteTimeMs,
        timedOutColor === 'BLACK' ? 0 : currentStore.blackTimeMs
      );

      await gameService
        .finishAiGame({
          gameId,
          fen: chessRef.current.fen(),
          pgn: chessRef.current.pgn(),
          result: 'TIMEOUT',
          winnerId,
          whiteTimeMs: timedOutColor === 'WHITE' ? 0 : currentStore.whiteTimeMs,
          blackTimeMs: timedOutColor === 'BLACK' ? 0 : currentStore.blackTimeMs,
          moves: currentStore.moves,
        })
        .catch((err) => console.warn('[useGame] finishAiGame timeout error:', err));
    },
    [gameId, userColor, currentUserId]
  );

  // Active clock countdown interval
  useEffect(() => {
    if (store.gameStatus !== 'ACTIVE') return;

    const isAiGame = store.currentGame?.gameType === 'PLAYER_VS_AI';

    const timer = setInterval(() => {
      if (isAiGame) {
        const now = Date.now();
        const elapsed = now - turnStartedAtRef.current;
        turnStartedAtRef.current = now;

        const currentStore = gameStore.getState();
        if (currentStore.currentTurn === 'WHITE' && currentStore.whiteTimeMs !== null) {
          const nextTime = Math.max(0, currentStore.whiteTimeMs - elapsed);
          if (nextTime === 0) {
            handleLocalTimeout('WHITE');
            return;
          }
          gameStore.updateClocks(nextTime, currentStore.blackTimeMs);
        } else if (currentStore.currentTurn === 'BLACK' && currentStore.blackTimeMs !== null) {
          const nextTime = Math.max(0, currentStore.blackTimeMs - elapsed);
          if (nextTime === 0) {
            handleLocalTimeout('BLACK');
            return;
          }
          gameStore.updateClocks(currentStore.whiteTimeMs, nextTime);
        }
      } else {
        gameStore.tickActiveClock(1000);
      }
    }, 500);

    return () => clearInterval(timer);
  }, [store.gameStatus, store.currentTurn, handleLocalTimeout]);

  // Polling fallback: PVP only! Never poll during local AI games!
  useEffect(() => {
    if (!gameId || store.gameStatus !== 'ACTIVE') return;
    if (store.currentGame?.gameType === 'PLAYER_VS_AI') return;

    let isPolling = false;
    const interval = setInterval(async () => {
      if (isPolling) return;
      isPolling = true;
      try {
        const state = await gameService.getGameState(gameId);
        const currentStoreState = gameStore.getState();
        if (state && currentStoreState.gameStatus === 'ACTIVE') {
          if (isSubmittingMoveRef.current) return;

          if (
            currentStoreState.moves.length > 0 &&
            state.moveCount !== undefined &&
            state.moveCount < currentStoreState.moves.length
          ) {
            return;
          }

          if (
            state.fen !== currentStoreState.fen ||
            state.currentTurn !== currentStoreState.currentTurn ||
            state.status !== currentStoreState.gameStatus
          ) {
            gameStore.updateGameState(state);
            const moves = await gameService.getMoves(gameId).catch(() => []);
            if (moves && moves.length > 0) {
              gameStore.setMoves(moves);
            }
          }
        }
      } catch (err) {
        // Silent catch for background polling
      } finally {
        isPolling = false;
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [gameId, store.gameStatus]);

  // Synchronize timeout state with backend for PVP
  useEffect(() => {
    if (store.gameStatus === 'COMPLETED' && store.result === 'TIMEOUT' && gameId) {
      if (store.currentGame?.gameType !== 'PLAYER_VS_AI') {
        gameService.getGameState(gameId).catch(() => {});
      }
    }
  }, [store.gameStatus, store.result, gameId]);

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

  // Trigger local AI move computation and apply when complete
  const triggerAiMove = useCallback(async () => {
    if (isAiThinkingRef.current) return;
    const currentStore = gameStore.getState();
    const game = currentStore.currentGame;
    if (!game || game.gameType !== 'PLAYER_VS_AI' || currentStore.gameStatus !== 'ACTIVE') return;

    const aiColor: PlayerColor = userColor === 'WHITE' ? 'BLACK' : 'WHITE';
    if (currentStore.currentTurn !== aiColor) return;

    const chess = chessRef.current;
    if (currentStore.fen && chess.fen() !== currentStore.fen) {
      try {
        chess.load(currentStore.fen);
      } catch {}
    }

    const currentFen = chess.fen();
    if (lastAiFenProcessedRef.current === currentFen) return;
    lastAiFenProcessedRef.current = currentFen;
    isAiThinkingRef.current = true;

    try {
      const difficulty = (game.aiDifficulty as any) || 'MEDIUM';
      const bestMove = await localAiService.getBestMove(currentFen, difficulty);
      if (!bestMove) return;

      // Ensure match is still active and it is still AI's turn
      const latestStore = gameStore.getState();
      if (latestStore.gameStatus !== 'ACTIVE' || latestStore.currentTurn !== aiColor) return;
      if (chessRef.current.fen() !== currentFen) return;

      const aiChessMove = chessRef.current.move({
        from: bestMove.from,
        to: bestMove.to,
        promotion: (bestMove.promotion as any) || 'q',
      });
      if (!aiChessMove) return;

      const now = Date.now();
      const elapsed = Math.max(0, now - turnStartedAtRef.current);
      turnStartedAtRef.current = now;

      const storeNow = gameStore.getState();
      const prevWhite = storeNow.whiteTimeMs;
      const prevBlack = storeNow.blackTimeMs;
      const newWhite =
        aiColor === 'WHITE' && prevWhite !== null
          ? Math.max(0, prevWhite - elapsed)
          : prevWhite;
      const newBlack =
        aiColor === 'BLACK' && prevBlack !== null
          ? Math.max(0, prevBlack - elapsed)
          : prevBlack;

      const nextFen = chessRef.current.fen();
      gameStore.applyLiveMove({
        from: bestMove.from,
        to: bestMove.to,
        promotion: bestMove.promotion,
        san: aiChessMove.san,
        fen: nextFen,
        nextTurn: userColor || 'WHITE',
        color: aiColor,
        whiteTimeMs: newWhite,
        blackTimeMs: newBlack,
      });

      if (chessRef.current.isGameOver()) {
        const overInfo = checkLocalGameOver(chessRef.current, aiColor, userColor, currentUserId);
        gameStore.setGameFinished(overInfo.result, overInfo.winnerId);
        const finalMoves = gameStore.getState().moves;
        await gameService
          .finishAiGame({
            gameId,
            fen: nextFen,
            pgn: chessRef.current.pgn(),
            result: overInfo.result,
            winnerId: overInfo.winnerId,
            whiteTimeMs: newWhite,
            blackTimeMs: newBlack,
            moves: finalMoves,
          })
          .catch((err) => console.warn('[useGame] finishAiGame error:', err));
      }
    } catch (err) {
      console.error('[useGame] triggerAiMove failed:', err);
    } finally {
      isAiThinkingRef.current = false;
    }
  }, [gameId, userColor, currentUserId]);

  // Automatically trigger AI move whenever it becomes AI's turn
  useEffect(() => {
    if (store.gameStatus !== 'ACTIVE') return;
    if (store.currentGame?.gameType !== 'PLAYER_VS_AI') return;

    const aiColor: PlayerColor = userColor === 'WHITE' ? 'BLACK' : 'WHITE';
    if (store.currentTurn === aiColor) {
      const timer = setTimeout(() => {
        triggerAiMove();
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [store.currentTurn, store.gameStatus, userColor, triggerAiMove]);

  // Handle board square click
  const handleSquarePress = useCallback(
    async (square: Square) => {
      if (store.gameStatus !== 'ACTIVE') {
        return;
      }

      if (!isMyTurn) {
        return;
      }

      if (isSubmittingMove) {
        return;
      }

      const chess = chessRef.current;
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
        const piece = chess.get(selectedSquare);
        const isPromotion =
          piece?.type === 'p' &&
          ((piece.color === 'w' && square[1] === '8') ||
            (piece.color === 'b' && square[1] === '1'));

        if (isPromotion) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

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

  // Dispatch move with optimistic local execution
  const executeMove = async (from: Square, to: Square, promotion?: string) => {
    setSelectedSquare(null);
    setPossibleMoves([]);
    setPendingPromotion(null);

    const chess = chessRef.current;
    const isAiGame = store.currentGame?.gameType === 'PLAYER_VS_AI';
    const previousFen = store.fen;
    const previousTurn = store.currentTurn;
    const previousMoves = [...store.moves];

    // 1. Validate and execute move on local chess.js instance immediately
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

    // 2. If Playing vs AI: 100% local phone execution (0ms latency, zero DB round-trips)
    if (isAiGame) {
      const now = Date.now();
      const elapsed = Math.max(0, now - turnStartedAtRef.current);
      turnStartedAtRef.current = now;

      const storeState = gameStore.getState();
      const prevWhite = storeState.whiteTimeMs;
      const prevBlack = storeState.blackTimeMs;
      const newWhite =
        userColor === 'WHITE' && prevWhite !== null
          ? Math.max(0, prevWhite - elapsed)
          : prevWhite;
      const newBlack =
        userColor === 'BLACK' && prevBlack !== null
          ? Math.max(0, prevBlack - elapsed)
          : prevBlack;

      const optimisticFen = chess.fen();
      const nextTurn: PlayerColor = userColor === 'WHITE' ? 'BLACK' : 'WHITE';
      const moveColor: PlayerColor = userColor || 'WHITE';

      gameStore.applyLiveMove({
        from,
        to,
        promotion,
        san: localMove.san,
        fen: optimisticFen,
        nextTurn,
        color: moveColor,
        whiteTimeMs: newWhite,
        blackTimeMs: newBlack,
      });

      if (chess.isGameOver()) {
        const overInfo = checkLocalGameOver(chess, userColor || 'WHITE', userColor, currentUserId);
        gameStore.setGameFinished(overInfo.result, overInfo.winnerId);
        const finalMoves = gameStore.getState().moves;
        gameService
          .finishAiGame({
            gameId,
            fen: optimisticFen,
            pgn: chess.pgn(),
            result: overInfo.result,
            winnerId: overInfo.winnerId,
            whiteTimeMs: newWhite,
            blackTimeMs: newBlack,
            moves: finalMoves,
          })
          .catch((err) => console.warn('[useGame] finishAiGame error:', err));
        return;
      }

      // Schedule AI turn immediately
      triggerAiMove();
      return;
    }

    // 3. Multiplayer PVP: optimistic board update + backend synchronization
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

    isSubmittingMoveRef.current = true;
    setIsSubmittingMove(true);

    try {
      const response = await gameService.makeMove(gameId, {
        from,
        to,
        promotion,
      });

      if (response) {
        if (response.whiteTimeMs !== undefined && response.blackTimeMs !== undefined) {
          gameStore.updateClocks(response.whiteTimeMs, response.blackTimeMs);
        }
        if (response.status === 'COMPLETED' || response.result) {
          gameStore.setGameFinished(response.result!, response.winnerId ?? null);
        }
      }
    } catch (err: any) {
      console.warn('[useGame] Move rejected by server, rolling back:', err);
      chess.load(previousFen);
      gameStore.updateGameState({
        fen: previousFen,
        currentTurn: previousTurn,
      });
      gameStore.setMoves(previousMoves);
    } finally {
      isSubmittingMoveRef.current = false;
      setIsSubmittingMove(false);
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
      if (store.currentGame?.gameType === 'PLAYER_VS_AI') {
        const chess = chessRef.current;
        gameStore.setGameFinished('RESIGNATION', null);
        const finalMoves = gameStore.getState().moves;
        await gameService
          .finishAiGame({
            gameId,
            fen: chess.fen(),
            pgn: chess.pgn(),
            result: 'RESIGNATION',
            winnerId: null,
            whiteTimeMs: store.whiteTimeMs,
            blackTimeMs: store.blackTimeMs,
            moves: finalMoves,
          })
          .catch((err) => console.warn('[useGame] finishAiGame resign error:', err));
        return;
      }
      await gameService.resignGame(gameId);
    } catch (err: any) {
      console.warn('[useGame] Resign failed:', err);
    }
  };

  const offerDraw = async () => {
    try {
      if (store.currentGame?.gameType === 'PLAYER_VS_AI') {
        const chess = chessRef.current;
        const moveCount = store.moves.length;
        if (moveCount >= 10 && !chess.isCheck()) {
          gameStore.setGameFinished('DRAW', null);
          const finalMoves = gameStore.getState().moves;
          await gameService
            .finishAiGame({
              gameId,
              fen: chess.fen(),
              pgn: chess.pgn(),
              result: 'DRAW',
              winnerId: null,
              whiteTimeMs: store.whiteTimeMs,
              blackTimeMs: store.blackTimeMs,
              moves: finalMoves,
            })
            .catch((err) => console.warn('[useGame] finishAiGame draw error:', err));
        } else {
          Alert.alert('Draw Declined', 'The AI declined the draw offer in this position.');
        }
        return;
      }
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
