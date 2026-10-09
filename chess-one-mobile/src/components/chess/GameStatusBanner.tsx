import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Color } from 'chess.js';
import { GameStatusInfo } from '../../types/chess.types';

interface GameStatusBannerProps {
  turn: Color;
  status: GameStatusInfo;
  onNewGame: () => void;
}

export const GameStatusBanner: React.FC<GameStatusBannerProps> = ({
  turn,
  status,
  onNewGame,
}) => {
  const isWhite = turn === 'w';

  if (status.isGameOver) {
    const isCheckmate = status.isCheckmate;

    return (
      <View style={[styles.container, styles.gameOverContainer]}>
        <View style={styles.gameOverTextContainer}>
          <Text style={styles.gameOverTitle}>
            {isCheckmate
              ? `Checkmate! ${status.winner === 'w' ? 'White' : 'Black'} Wins!`
              : 'Game Drawn'}
          </Text>
          <Text style={styles.gameOverSubtitle}>{status.description}</Text>
        </View>

        <TouchableOpacity
          style={styles.newGameButton}
          activeOpacity={0.7}
          onPress={onNewGame}
        >
          <Text style={styles.newGameButtonText}>New Game</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.turnIndicator}>
        <View
          style={[
            styles.turnBadgeDot,
            { backgroundColor: isWhite ? COLORS.textHeading : COLORS.white },
          ]}
        />
        <Text style={styles.turnText}>
          {isWhite ? 'White to move' : 'Black to move'}
        </Text>
      </View>

      {status.isCheck && (
        <View style={styles.checkBadge}>
          <Text style={styles.checkText}>⚠️ CHECK!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: '100%',
  },
  gameOverContainer: {
    backgroundColor: COLORS.border,
    borderColor: COLORS.border,
    borderWidth: 1.5,
    paddingVertical: 14,
  },
  gameOverTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  gameOverTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  gameOverSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
  },
  newGameButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newGameButtonText: {
    color: COLORS.textHeading,
    fontWeight: '700',
    fontSize: 13,
  },
  turnIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  turnBadgeDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  turnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  checkBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkText: {
    color: COLORS.textHeading,
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
