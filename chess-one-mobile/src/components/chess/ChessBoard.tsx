import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React, { useMemo, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Square, PieceSymbol, Color } from 'chess.js';
import { ChessPiece } from './ChessPiece';
import {
  coordsToSquare,
  isSquareLight,
  FILES,
  RANKS,
  DEFAULT_FEN,
} from '../../utils/chess.utils';
import { LastMove } from '../../types/chess.types';

interface ChessBoardProps {
  fen: string;
  selectedSquare: Square | null;
  possibleMoves: Square[];
  lastMove: LastMove | null;
  inCheckSquare: Square | null;
  onSquarePress: (square: Square) => void;
  orientation?: 'w' | 'b';
}

interface ParsedPiece {
  type: PieceSymbol;
  color: Color;
}

const ChessBoardComponent: React.FC<ChessBoardProps> = ({
  fen,
  selectedSquare,
  possibleMoves,
  lastMove,
  inCheckSquare,
  onSquarePress,
  orientation = 'w',
}) => {
  const { width } = useWindowDimensions();

  // Width of outer coordinate margins (Numbers on Left, Letters on Bottom)
  const gutterSize = 20;

  // Responsive board sizing: max 400px, fitting phone width with padding
  const containerSize = useMemo(() => {
    const horizontalPadding = 24;
    const available = width - horizontalPadding;
    return Math.min(available, 400);
  }, [width]);

  const gridSize = containerSize - gutterSize;
  const tileSize = gridSize / 8;

  // Parse FEN string into square lookup
  const boardMap = useMemo(() => {
    const map = new Map<Square, ParsedPiece>();
    const effectiveFen = (fen && typeof fen === 'string' && fen.trim().length > 0) ? fen : DEFAULT_FEN;

    const [placement] = effectiveFen.split(' ');
    if (!placement) return map;
    const rows = placement.split('/');
    if (rows.length !== 8) return map;

    rows.forEach((rowStr, rIdx) => {
      let colIdx = 0;
      for (const ch of rowStr) {
        if (/\d/.test(ch)) {
          const emptyCount = parseInt(ch, 10);
          colIdx += emptyCount;
        } else {
          const sq = coordsToSquare(colIdx, rIdx);
          const color: Color = ch === ch.toUpperCase() ? 'w' : 'b';
          const type = ch.toLowerCase() as PieceSymbol;
          map.set(sq, { type, color });
          colIdx++;
        }
      }
    });

    return map;
  }, [fen]);

  // Order of rows and columns based on orientation
  const rowIndices = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];
  const colIndices = orientation === 'w' ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0];

  return (
    <View style={[styles.outerFrame, { width: containerSize, height: containerSize }]}>
      {/* Top Section: Left rank numbers (1-8) outside + 8x8 Grid */}
      <View style={styles.topSection}>
        {/* Left Gutter: Rank numbers (1-8) positioned completely OUTSIDE the board tiles */}
        <View style={[styles.leftGutter, { width: gutterSize, height: gridSize }]}>
          {rowIndices.map((rIdx) => (
            <View key={`rank-${rIdx}`} style={[styles.coordCell, { height: tileSize }]}>
              <Text style={styles.coordText}>{RANKS[rIdx]}</Text>
            </View>
          ))}
        </View>

        {/* 8x8 Chessboard tiles grid */}
        <View style={[styles.boardGrid, { width: gridSize, height: gridSize }]}>
          {rowIndices.map((rIdx) => {
            return (
              <View key={`row-${rIdx}`} style={styles.boardRow}>
                {colIndices.map((cIdx) => {
                  const square = coordsToSquare(cIdx, rIdx);
                  const piece = boardMap.get(square);
                  const isLight = isSquareLight(cIdx, rIdx);

                  const isSelected = selectedSquare === square;
                  const isPossibleMove = possibleMoves.includes(square);
                  const isLastMoveFrom = lastMove?.from === square;
                  const isLastMoveTo = lastMove?.to === square;
                  const isInCheck = inCheckSquare === square;

                  // Refined, professional tile coloring (standard Chess.com / Lichess palette)
                  let tileBg = isLight ? '#E8ECDE' : '#8B9E7E';
                  if (isInCheck) {
                    tileBg = '#EF4444';
                  } else if (isSelected) {
                    tileBg = '#F7F769';
                  } else if (isLastMoveTo) {
                    tileBg = isLight ? '#F5F682' : '#BACA44';
                  } else if (isLastMoveFrom) {
                    tileBg = isLight ? '#EAEB9B' : '#9CAE48';
                  }

                  return (
                    <Pressable
                      key={square}
                      style={[
                        styles.tile,
                        {
                          width: tileSize,
                          height: tileSize,
                          backgroundColor: tileBg,
                        },
                      ]}
                      onPress={() => onSquarePress(square)}
                    >
                      {/* Piece */}
                      {piece && (
                        <ChessPiece
                          type={piece.type}
                          color={piece.color}
                          size={tileSize * 0.8}
                        />
                      )}

                      {/* Move Target indicator */}
                      {isPossibleMove && !piece && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.moveDot,
                            {
                              width: tileSize * 0.3,
                              height: tileSize * 0.3,
                              borderRadius: (tileSize * 0.3) / 2,
                            },
                          ]}
                        />
                      )}

                      {/* Capture Ring indicator */}
                      {isPossibleMove && piece && (
                        <View
                          pointerEvents="none"
                          style={[
                            styles.captureRing,
                            {
                              width: tileSize * 0.88,
                              height: tileSize * 0.88,
                              borderRadius: (tileSize * 0.88) / 2,
                            },
                          ]}
                        />
                      )}
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </View>
      </View>

      {/* Bottom Section: File letters (A-H) outside board */}
      <View style={[styles.bottomSection, { height: gutterSize }]}>
        {/* Corner placeholder matching left gutter */}
        <View style={{ width: gutterSize, height: gutterSize }} />

        {/* File letters A-H positioned completely OUTSIDE the board tiles */}
        <View style={[styles.bottomGutter, { width: gridSize, height: gutterSize }]}>
          {colIndices.map((cIdx) => (
            <View key={`file-${cIdx}`} style={[styles.coordCell, { width: tileSize }]}>
              <Text style={styles.coordText}>{FILES[cIdx].toUpperCase()}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

function arePossibleMovesEqual(a: Square[], b: Square[]): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function areLastMovesEqual(a: LastMove | null, b: LastMove | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.from === b.from && a.to === b.to;
}

// Lichess-grade memoization: Board never re-renders during clock ticks!
export const ChessBoard = memo<ChessBoardProps>(ChessBoardComponent, (prev, next) => {
  return (
    prev.fen === next.fen &&
    prev.selectedSquare === next.selectedSquare &&
    prev.inCheckSquare === next.inCheckSquare &&
    prev.orientation === next.orientation &&
    prev.onSquarePress === next.onSquarePress &&
    areLastMovesEqual(prev.lastMove, next.lastMove) &&
    arePossibleMovesEqual(prev.possibleMoves, next.possibleMoves)
  );
});

const styles = StyleSheet.create({
  outerFrame: {
    backgroundColor: '#E4EADB',
    borderRadius: 12,
    paddingTop: 4,
    paddingRight: 4,
    borderWidth: 1.5,
    borderColor: '#C6D2BC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
    userSelect: 'none' as any,
  },
  topSection: {
    flexDirection: 'row',
  },
  leftGutter: {
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomGutter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coordCell: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  coordText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#4B5C49',
    userSelect: 'none' as any,
  },
  boardGrid: {
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#607255',
  },
  boardRow: {
    flexDirection: 'row',
  },
  tile: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    cursor: 'pointer' as any,
    userSelect: 'none' as any,
  },
  selectedTile: {
    backgroundColor: '#F6F669',
  },
  lastMoveTile: {
    backgroundColor: '#D2E054',
  },
  inCheckTile: {
    backgroundColor: '#EF4444',
  },
  moveDot: {
    position: 'absolute',
    backgroundColor: 'rgba(20, 20, 20, 0.25)',
  },
  captureRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'rgba(20, 20, 20, 0.25)',
  },
});
