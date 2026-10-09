import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Color, PieceSymbol } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface PlayerCardProps {
  name: string;
  color: Color;
  isTurn: boolean;
  isCheck: boolean;
  capturedPieces: PieceSymbol[];
}

export const PlayerCard: React.FC<PlayerCardProps> = ({
  name,
  color,
  isTurn,
  isCheck,
  capturedPieces,
}) => {
  const isWhite = color === 'w';

  // Group captured pieces for clean display
  const pieceOrder: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];
  const sortedCaptures = [...capturedPieces].sort(
    (a, b) => pieceOrder.indexOf(a) - pieceOrder.indexOf(b)
  );

  return (
    <View
      style={[
        styles.container,
        isTurn && styles.activeContainer,
        isCheck && styles.checkContainer,
      ]}
    >
      <View style={styles.leftInfo}>
        <View
          style={[
            styles.avatarCircle,
            { backgroundColor: isWhite ? COLORS.textHeading : COLORS.white },
          ]}
        >
          <Text style={[styles.avatarText, { color: isWhite ? COLORS.white : COLORS.textHeading }]}>
            {isWhite ? '♔' : '♚'}
          </Text>
        </View>

        <View style={styles.nameBlock}>
          <View style={styles.nameRow}>
            <Text style={[styles.playerName, isTurn && styles.activePlayerName]}>
              {name}
            </Text>
            {isTurn && (
              <View style={styles.turnIndicatorBadge}>
                <Text style={styles.turnIndicatorText}>Turn</Text>
              </View>
            )}
            {isCheck && (
              <View style={styles.checkBadge}>
                <Text style={styles.checkText}>⚠️ Check</Text>
              </View>
            )}
          </View>

          {/* Captured pieces preview */}
          {sortedCaptures.length > 0 && (
            <View style={styles.capturedRow}>
              {sortedCaptures.map((type, idx) => (
                <View key={`${type}-${idx}`} style={styles.miniPiece}>
                  {/* Opposite color piece captured */}
                  <ChessPiece
                    type={type}
                    color={isWhite ? 'b' : 'w'}
                    size={16}
                  />
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    width: '100%',
  },
  activeContainer: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.border,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  checkContainer: {
    borderColor: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  leftInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    lineHeight: 26,
  },
  nameBlock: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  activePlayerName: {
    color: COLORS.textHeading,
  },
  turnIndicatorBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  turnIndicatorText: {
    color: COLORS.textHeading,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checkText: {
    color: COLORS.textHeading,
    fontSize: 11,
    fontWeight: '700',
  },
  capturedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginTop: 4,
    gap: 2,
  },
  miniPiece: {
    marginRight: 1,
  },
});
