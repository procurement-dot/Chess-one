import { useState, useCallback } from 'react';
import { Chess, Square, PieceSymbol, Color } from 'chess.js';
import { ChessService } from '../services/chess.service';
import {
  GameStatusInfo,
  MovePair,
  LastMove,
  PendingPromotion,
  MoveResult,
} from '../types/chess.types';
import { groupMovePairs } from '../utils/chess.utils';

export interface UseChessGameReturn {
  game: Chess;
  fen: string;
  turn: Color;
  status: GameStatusInfo;
  history: string[];
  movePairs: MovePair[];
  selectedSquare: Square | null;
  possibleMoves: Square[];
  lastMove: LastMove | null;
  pendingPromotion: PendingPromotion | null;
  inCheckSquare: Square | null;
  capturedPieces: { white: PieceSymbol[]; black: PieceSymbol[] };
  handleSquarePress: (square: Square) => void;
  makeMove: (from: string, to: string, promotion?: PieceSymbol) => MoveResult;
  confirmPromotion: (piece: PieceSymbol) => MoveResult | null;
  cancelPromotion: () => void;
  resetGame: () => void;
  undoMove: () => boolean;
}

export const useChessGame = (initialFen?: string): UseChessGameReturn => {
  const [game] = useState<Chess>(() => ChessService.createGame(initialFen));

  const [fen, setFen] = useState<string>(() => ChessService.getFen(game));
  const [turn, setTurn] = useState<Color>(() => ChessService.getTurn(game));
  const [status, setStatus] = useState<GameStatusInfo>(() => ChessService.getGameStatus(game));
  const [history, setHistory] = useState<string[]>(() => ChessService.getMoveHistory(game));
  const [movePairs, setMovePairs] = useState<MovePair[]>(() =>
    groupMovePairs(ChessService.getMoveHistory(game))
  );
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<LastMove | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<PendingPromotion | null>(null);
  const [capturedPieces, setCapturedPieces] = useState(() =>
    ChessService.getCapturedPieces(game)
  );

  const inCheckSquare: Square | null = status.isCheck
    ? ChessService.getKingSquare(game, turn)
    : null;

  const syncGameState = useCallback(
    (newLastMove?: LastMove | null) => {
      const newFen = ChessService.getFen(game);
      const newTurn = ChessService.getTurn(game);
      const newStatus = ChessService.getGameStatus(game);
      const newHistory = ChessService.getMoveHistory(game);
      const newMovePairs = groupMovePairs(newHistory);

      setFen(newFen);
      setTurn(newTurn);
      setStatus(newStatus);
      setHistory(newHistory);
      setMovePairs(newMovePairs);
      setCapturedPieces(ChessService.getCapturedPieces(game));
      setSelectedSquare(null);
      setPossibleMoves([]);

      if (newLastMove !== undefined) {
        setLastMove(newLastMove);
      }
    },
    [game]
  );

  const makeMove = useCallback(
    (from: string, to: string, promotion?: PieceSymbol): MoveResult => {
      const result = ChessService.makeMove(game, from, to, promotion);
      if (result.success && result.move) {
        syncGameState({ from: from as Square, to: to as Square });
      }
      return result;
    },
    [game, syncGameState]
  );

  const handleSquarePress = useCallback(
    (square: Square) => {
      // Ignore square clicks if game is completed or a promotion modal is open
      if (status.isGameOver || pendingPromotion) {
        return;
      }

      const currentTurn = game.turn();
      const pieceAtSquare = game.get(square);

      // Case 1: No square currently selected
      if (!selectedSquare) {
        // Can only select square if there is a piece belonging to the current turn
        if (pieceAtSquare && pieceAtSquare.color === currentTurn) {
          const legalMoves = ChessService.getLegalMoves(game, square);
          const targetSquares = legalMoves.map((m) => m.to as Square);
          setSelectedSquare(square);
          setPossibleMoves(targetSquares);
        }
        return;
      }

      // Case 2: User clicks the currently selected square again -> Deselect
      if (selectedSquare === square) {
        setSelectedSquare(null);
        setPossibleMoves([]);
        return;
      }

      // Case 3: User clicks another friendly piece -> Switch selection
      if (pieceAtSquare && pieceAtSquare.color === currentTurn) {
        const legalMoves = ChessService.getLegalMoves(game, square);
        const targetSquares = legalMoves.map((m) => m.to as Square);
        setSelectedSquare(square);
        setPossibleMoves(targetSquares);
        return;
      }

      // Case 4: User clicks a target square
      if (possibleMoves.includes(square)) {
        // Check if this move requires a pawn promotion
        if (ChessService.isPromotionMove(game, selectedSquare, square)) {
          setPendingPromotion({ from: selectedSquare, to: square });
          return;
        }

        // Normal legal move
        makeMove(selectedSquare, square);
        return;
      }

      // Case 5: User clicked an illegal square -> Clear selection
      setSelectedSquare(null);
      setPossibleMoves([]);
    },
    [game, status.isGameOver, pendingPromotion, selectedSquare, possibleMoves, makeMove]
  );

  const confirmPromotion = useCallback(
    (piece: PieceSymbol): MoveResult | null => {
      if (!pendingPromotion) return null;
      const { from, to } = pendingPromotion;
      setPendingPromotion(null);
      return makeMove(from, to, piece);
    },
    [pendingPromotion, makeMove]
  );

  const cancelPromotion = useCallback(() => {
    setPendingPromotion(null);
    setSelectedSquare(null);
    setPossibleMoves([]);
  }, []);

  const resetGame = useCallback(() => {
    ChessService.resetGame(game);
    setPendingPromotion(null);
    syncGameState(null);
  }, [game, syncGameState]);

  const undoMove = useCallback((): boolean => {
    const undone = game.undo();
    if (undone) {
      setPendingPromotion(null);
      syncGameState(null);
      return true;
    }
    return false;
  }, [game, syncGameState]);

  return {
    game,
    fen,
    turn,
    status,
    history,
    movePairs,
    selectedSquare,
    possibleMoves,
    lastMove,
    pendingPromotion,
    inCheckSquare,
    capturedPieces,
    handleSquarePress,
    makeMove,
    confirmPromotion,
    cancelPromotion,
    resetGame,
    undoMove,
  };
};
