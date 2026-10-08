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
            { backgroundColor: isWhite ? '#FFFFFF' : '#111827' },
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    width: '100%',
  },
  gameOverContainer: {
    backgroundColor: '#EEF3E8',
    borderColor: '#194E40',
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
    color: '#194E40',
    marginBottom: 2,
  },
  gameOverSubtitle: {
    fontSize: 12,
    color: '#74817A',
  },
  newGameButton: {
    backgroundColor: '#194E40',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  newGameButtonText: {
    color: '#FFFFFF',
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
    borderColor: '#202D29',
  },
  turnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202D29',
  },
  checkBadge: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  checkText: {
    color: '#C53030',
    fontWeight: '700',
    fontSize: 12,
    letterSpacing: 0.5,
  },
});
