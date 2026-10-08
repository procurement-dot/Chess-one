import React, { useMemo } from 'react';
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

export const ChessBoard: React.FC<ChessBoardProps> = ({
  fen,
  selectedSquare,
  possibleMoves,
  lastMove,
  inCheckSquare,
  onSquarePress,
  orientation = 'w',
}) => {
  const { width } = useWindowDimensions();

  // Responsive board sizing: max 400px, fitting phone width with padding
  const boardSize = useMemo(() => {
    const horizontalPadding = 32;
    const available = width - horizontalPadding;
    return Math.min(available, 400);
  }, [width]);

  const tileSize = boardSize / 8;

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
    <View style={[styles.boardContainer, { width: boardSize, height: boardSize }]}>
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

              // ChessOne School Board tokens (from style.css)
              let tileBg = isLight ? '#EEF0E0' : '#8EA780';
              if (isInCheck) {
                tileBg = '#F7A18C';
              } else if (isSelected) {
                tileBg = '#E9CB67';
              } else if (isLastMoveTo) {
                tileBg = isLight ? '#D6EF9E' : '#A2BE93';
              } else if (isLastMoveFrom) {
                tileBg = isLight ? '#E5EDDA' : '#97AE89';
              }

              // Rank coordinate shown on left edge; File coordinate shown on bottom edge
              const showRank = orientation === 'w' ? cIdx === 0 : cIdx === 7;
              const showFile = orientation === 'w' ? rIdx === 7 : rIdx === 0;

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
                  {/* Rank notation (1-8) */}
                  {showRank && (
                    <Text
                      pointerEvents="none"
                      style={[
                        styles.coordRankText,
                        { color: isLight ? '#8EA780' : '#EEF0E0' },
                      ]}
                    >
                      {RANKS[rIdx]}
                    </Text>
                  )}

                  {/* File notation (a-h) */}
                  {showFile && (
                    <Text
                      pointerEvents="none"
                      style={[
                        styles.coordFileText,
                        { color: isLight ? '#8EA780' : '#EEF0E0' },
                      ]}
                    >
                      {FILES[cIdx]}
                    </Text>
                  )}

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
  );
};

const styles = StyleSheet.create({
  boardContainer: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2.5,
    borderColor: '#D5DFC8',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    userSelect: 'none' as any,
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
    backgroundColor: '#E9CB67',
  },
  lastMoveTile: {
    backgroundColor: '#D6EF9E',
  },
  inCheckTile: {
    backgroundColor: '#F7A18C',
  },
  coordRankText: {
    position: 'absolute',
    top: 2,
    left: 2,
    fontSize: 9,
    fontWeight: '700',
  },
  coordFileText: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    fontSize: 9,
    fontWeight: '700',
  },
  moveDot: {
    position: 'absolute',
    backgroundColor: 'rgba(25, 78, 64, 0.4)',
  },
  captureRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: 'rgba(25, 78, 64, 0.4)',
  },
});
