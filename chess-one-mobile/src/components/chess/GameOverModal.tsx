import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { GameStatusInfo } from '../../types/chess.types';

interface GameOverModalProps {
  visible: boolean;
  status: GameStatusInfo;
  onNewGame: () => void;
  onClose?: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  status,
  onNewGame,
  onClose,
}) => {
  if (!visible) return null;

  const isCheckmate = status.isCheckmate;
  const winnerTitle =
    status.winner === 'w'
      ? 'White Wins! 🏆'
      : status.winner === 'b'
      ? 'Black Wins! 🏆'
      : 'Draw';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose || onNewGame}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>{isCheckmate ? '👑' : '🤝'}</Text>
          </View>

          <Text style={styles.title}>
            {isCheckmate ? 'CHECKMATE' : 'DRAW'}
          </Text>

          <Text style={styles.winnerSubtitle}>
            {isCheckmate ? winnerTitle : status.description}
          </Text>

          {isCheckmate && (
            <Text style={styles.descriptionText}>{status.description}</Text>
          )}

          <TouchableOpacity
            style={styles.newGameButton}
            activeOpacity={0.8}
            onPress={onNewGame}
          >
            <Text style={styles.newGameText}>New Game</Text>
          </TouchableOpacity>

          {onClose && (
            <TouchableOpacity
              style={styles.reviewButton}
              activeOpacity={0.7}
              onPress={onClose}
            >
              <Text style={styles.reviewText}>Review Board</Text>
            </TouchableOpacity>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.textHeading,
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  winnerSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 6,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: 20,
    textAlign: 'center',
  },
  newGameButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  newGameText: {
    color: COLORS.textHeading,
    fontSize: 16,
    fontWeight: '700',
  },
  reviewButton: {
    width: '100%',
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  reviewText: {
    color: COLORS.textBody,
    fontSize: 13,
    fontWeight: '600',
  },
});
