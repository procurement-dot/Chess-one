import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { GameStatusInfo } from '../../types/chess.types';

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');

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
          <Image
            source={logoBanner}
            style={styles.brandLogo}
            resizeMode="contain"
          />
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
    backgroundColor: 'rgba(32, 45, 41, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  brandLogo: {
    width: 110,
    height: 38,
    marginBottom: 12,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#D5DFC8',
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#202D29',
    letterSpacing: 1.5,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  winnerSubtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#194E40',
    marginBottom: 6,
    textAlign: 'center',
  },
  descriptionText: {
    fontSize: 13,
    color: '#74817A',
    marginBottom: 20,
    textAlign: 'center',
  },
  newGameButton: {
    width: '100%',
    backgroundColor: '#194E40',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  newGameText: {
    color: '#FFFFFF',
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
    color: '#74817A',
    fontSize: 13,
    fontWeight: '600',
  },
});
