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
            { backgroundColor: isWhite ? '#FFFFFF' : '#202D29' },
          ]}
        >
          <Text style={[styles.avatarText, { color: isWhite ? '#194E40' : '#D6EF9E' }]}>
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E9E1',
    width: '100%',
  },
  activeContainer: {
    borderColor: '#194E40',
    backgroundColor: '#FFFFFF',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  checkContainer: {
    borderColor: '#C53030',
    backgroundColor: '#FCEDDF',
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
    borderColor: '#D5DFC8',
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
    color: '#202D29',
  },
  activePlayerName: {
    color: '#194E40',
  },
  turnIndicatorBadge: {
    backgroundColor: '#194E40',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  turnIndicatorText: {
    color: '#D6EF9E',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  checkBadge: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  checkText: {
    color: '#C53030',
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
