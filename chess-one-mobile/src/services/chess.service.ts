import { Chess, Square, PieceSymbol, Color, Move } from 'chess.js';
import { GameStatusInfo, MoveResult } from '../types/chess.types';

export class ChessService {
  /**
   * Creates a new instance of the Chess engine
   */
  public static createGame(fen?: string): Chess {
    return fen ? new Chess(fen) : new Chess();
  }

  /**
   * Returns current FEN string
   */
  public static getFen(game: Chess): string {
    return game.fen();
  }

  /**
   * Returns current active turn ('w' or 'b')
   */
  public static getTurn(game: Chess): Color {
    return game.turn();
  }

  /**
   * Checks whether a move from square to square requires a pawn promotion
   */
  public static isPromotionMove(game: Chess, from: Square, to: Square): boolean {
    const legalMoves = game.moves({ square: from, verbose: true });
    return legalMoves.some((m) => m.to === to && Boolean(m.promotion));
  }

  /**
   * Central move execution function with legal move verification
   */
  public static makeMove(
    game: Chess,
    from: string,
    to: string,
    promotion?: PieceSymbol
  ): MoveResult {
    try {
      const move = game.move({
        from,
        to,
        promotion: promotion || undefined,
      });

      if (!move) {
        return {
          success: false,
          reason: 'Illegal move',
        };
      }

      return {
        success: true,
        move,
      };
    } catch {
      return {
        success: false,
        reason: 'Invalid move',
      };
    }
  }

  /**
   * Returns all legal moves for a specific square or the entire board
   */
  public static getLegalMoves(game: Chess, square?: Square): Move[] {
    try {
      if (square) {
        return game.moves({ square, verbose: true });
      }
      return game.moves({ verbose: true });
    } catch {
      return [];
    }
  }

  /**
   * Returns the square where the king of the specified color is located
   */
  public static getKingSquare(game: Chess, color: Color): Square | null {
    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          return piece.square;
        }
      }
    }
    return null;
  }

  /**
   * Analyzes game state for check, checkmate, stalemate, and various draw conditions
   */
  public static getGameStatus(game: Chess): GameStatusInfo {
    const isCheck = game.isCheck();
    const isCheckmate = game.isCheckmate();
    const isStalemate = game.isStalemate();
    const isThreefold = game.isThreefoldRepetition();
    const isInsufficient = game.isInsufficientMaterial();
    const isFiftyMoves = game.isDrawByFiftyMoves();
    const isDraw = game.isDraw();
    const currentTurn = game.turn();

    if (isCheckmate) {
      // Winner is the side that just moved (opposite of current turn)
      const winner: Color = currentTurn === 'w' ? 'b' : 'w';
      return {
        status: 'checkmate',
        isCheck: true,
        isCheckmate: true,
        isDraw: false,
        isGameOver: true,
        winner,
        description: `Checkmate! ${winner === 'w' ? 'White' : 'Black'} wins!`,
      };
    }

    if (isStalemate) {
      return {
        status: 'stalemate',
        isCheck: false,
        isCheckmate: false,
        isDraw: true,
        isGameOver: true,
        winner: 'draw',
        description: 'Draw by Stalemate',
      };
    }

    if (isThreefold) {
      return {
        status: 'threefold_repetition',
        isCheck: isCheck,
        isCheckmate: false,
        isDraw: true,
        isGameOver: true,
        winner: 'draw',
        description: 'Draw by Threefold Repetition',
      };
    }

    if (isInsufficient) {
      return {
        status: 'insufficient_material',
        isCheck: false,
        isCheckmate: false,
        isDraw: true,
        isGameOver: true,
        winner: 'draw',
        description: 'Draw by Insufficient Material',
      };
    }

    if (isFiftyMoves) {
      return {
        status: 'fifty_moves',
        isCheck: isCheck,
        isCheckmate: false,
        isDraw: true,
        isGameOver: true,
        winner: 'draw',
        description: 'Draw by 50-Move Rule',
      };
    }

    if (isDraw) {
      return {
        status: 'draw',
        isCheck: isCheck,
        isCheckmate: false,
        isDraw: true,
        isGameOver: true,
        winner: 'draw',
        description: 'Game Drawn',
      };
    }

    if (isCheck) {
      return {
        status: 'check',
        isCheck: true,
        isCheckmate: false,
        isDraw: false,
        isGameOver: false,
        winner: null,
        description: `Check! ${currentTurn === 'w' ? 'White' : 'Black'} king is under attack`,
      };
    }

    return {
      status: 'active',
      isCheck: false,
      isCheckmate: false,
      isDraw: false,
      isGameOver: false,
      winner: null,
      description: `${currentTurn === 'w' ? 'White' : 'Black'} to move`,
    };
  }

  /**
   * Resets the chess game to starting position
   */
  public static resetGame(game: Chess): void {
    game.reset();
  }

  /**
   * Loads a custom FEN position
   */
  public static loadFen(game: Chess, fen: string): boolean {
    try {
      game.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Gets move history in standard SAN notation
   */
  public static getMoveHistory(game: Chess): string[] {
    return game.history();
  }

  /**
   * Returns list of captured pieces for white and black
   */
  public static getCapturedPieces(
    game: Chess
  ): { white: PieceSymbol[]; black: PieceSymbol[] } {
    const STARTING_COUNTS: Record<PieceSymbol, number> = {
      p: 8,
      n: 2,
      b: 2,
      r: 2,
      q: 1,
      k: 1,
    };
    const currentWhite: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };
    const currentBlack: Record<PieceSymbol, number> = { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 };

    const board = game.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece) {
          if (piece.color === 'w') {
            currentWhite[piece.type] = (currentWhite[piece.type] || 0) + 1;
          } else {
            currentBlack[piece.type] = (currentBlack[piece.type] || 0) + 1;
          }
        }
      }
    }

    const capturedWhite: PieceSymbol[] = [];
    const capturedBlack: PieceSymbol[] = [];

    (['q', 'r', 'b', 'n', 'p'] as PieceSymbol[]).forEach((type) => {
      const missingWhite = Math.max(0, STARTING_COUNTS[type] - (currentWhite[type] || 0));
      for (let i = 0; i < missingWhite; i++) capturedWhite.push(type);

      const missingBlack = Math.max(0, STARTING_COUNTS[type] - (currentBlack[type] || 0));
      for (let i = 0; i < missingBlack; i++) capturedBlack.push(type);
    });

    return {
      white: capturedWhite,
      black: capturedBlack,
    };
  }
}
