import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Game, GameResult, PlayerColor } from '../../types/game.types';

interface GameOverModalProps {
  visible: boolean;
  result: GameResult | string | null;
  winnerId: number | null;
  userColor: PlayerColor | null;
  currentUserId: number | null;
  game: Game | null;
  onViewResults: () => void;
  onPlayAgain: () => void;
  onGoHome: () => void;
  onClose: () => void;
  onAiReview: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  visible,
  result,
  winnerId,
  userColor,
  currentUserId,
  game,
  onViewResults,
  onPlayAgain,
  onGoHome,
  onClose,
  onAiReview,
}) => {
  if (!visible) return null;

  const isAI = game?.gameType === 'PLAYER_VS_AI';
  const isDraw = result === 'DRAW' || result === 'STALEMATE';

  // Determine user win/loss status
  let isWinner = false;
  let isLoser = false;

  if (winnerId !== null && currentUserId !== null) {
    if (winnerId === currentUserId) {
      isWinner = true;
    } else {
      isLoser = true;
    }
  } else if (isAI) {
    // In AI games, if user is White and winner is White player id
    if (winnerId === null && result !== 'DRAW' && result !== 'STALEMATE') {
      // AI won
      isLoser = true;
    } else if (winnerId !== null) {
      isWinner = winnerId === currentUserId;
      isLoser = !isWinner;
    }
  }

  // Reason description & header
  let title = 'Game Over';
  let icon = '🏁';
  let reasonText = 'Match has ended';

  switch (result) {
    case 'TIMEOUT':
      title = 'Time Finished!';
      icon = '⏰';
      reasonText = isWinner
        ? 'Opponent ran out of time!'
        : isLoser
        ? 'Your clock reached 00:00. Time is finished!'
        : 'Time expired.';
      break;

    case 'CHECKMATE':
      title = 'Checkmate!';
      icon = '👑';
      reasonText = isWinner
        ? 'You delivered checkmate! Glorious victory!'
        : isLoser
        ? 'Your King was checkmated.'
        : 'Match ended by checkmate.';
      break;

    case 'RESIGNATION':
      title = 'Resignation';
      icon = '🏳️';
      reasonText = isWinner
        ? 'Opponent resigned the match!'
        : 'You resigned the match.';
      break;

    case 'DRAW':
      title = 'Draw';
      icon = '🤝';
      reasonText = 'Mutual agreement draw.';
      break;

    case 'STALEMATE':
      title = 'Stalemate';
      icon = '⚖️';
      reasonText = 'No legal moves available. Match drawn.';
      break;

    default:
      title = 'Game Over';
      icon = '🏁';
      reasonText = 'Match has concluded.';
      break;
  }

  // Outcome banner
  let outcomeText = 'MATCH FINISHED';
  let outcomeBg = '#374151';
  let outcomeColor = '#9CA3AF';

  if (isWinner) {
    outcomeText = '🏆 VICTORY';
    outcomeBg = '#065F46';
    outcomeColor = '#34D399';
  } else if (isLoser) {
    outcomeText = '💔 DEFEAT';
    outcomeBg = '#7F1D1D';
    outcomeColor = '#F87171';
  } else if (isDraw) {
    outcomeText = '🤝 DRAW';
    outcomeBg = '#78350F';
    outcomeColor = '#FBBF24';
  }

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
          {/* Close button for board review */}
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>

          {/* Big Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.bigIcon}>{icon}</Text>
          </View>

          {/* Outcome Pill */}
          <View style={[styles.outcomeBadge, { backgroundColor: outcomeBg }]}>
            <Text style={[styles.outcomeText, { color: outcomeColor }]}>{outcomeText}</Text>
          </View>

          {/* Title & Reason */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.reason}>{reasonText}</Text>

          {/* Player Breakdown */}
          <View style={styles.playersSummary}>
            <View style={styles.playerRow}>
              <Text style={styles.playerRole}>White: </Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {game?.whitePlayer?.name || (game?.whitePlayerId ? `Player #${game.whitePlayerId}` : 'Stockfish AI')}
              </Text>
            </View>
            <View style={styles.playerRow}>
              <Text style={styles.playerRole}>Black: </Text>
              <Text style={styles.playerName} numberOfLines={1}>
                {game?.blackPlayer?.name || (game?.blackPlayerId ? `Player #${game.blackPlayerId}` : 'Stockfish AI')}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={styles.aiReviewBtn}
              activeOpacity={0.8}
              onPress={onAiReview}
            >
              <View style={styles.aiReviewContent}>
                <Text style={styles.aiReviewSparkle}>✨</Text>
                <Text style={styles.aiReviewBtnText}>🤖 AI Match Review & Analysis</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.primaryBtn}
              activeOpacity={0.8}
              onPress={onViewResults}
            >
              <Text style={styles.primaryBtnText}>📊 View Full Results</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              activeOpacity={0.8}
              onPress={onPlayAgain}
            >
              <Text style={styles.secondaryBtnText}>🔄 Play Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ghostBtn}
              activeOpacity={0.8}
              onPress={onGoHome}
            >
              <Text style={styles.ghostBtnText}>🏠 Back to Home</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  iconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 2,
    borderColor: '#334155',
  },
  bigIcon: {
    fontSize: 38,
  },
  outcomeBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  outcomeText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  reason: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 20,
    paddingHorizontal: 8,
  },
  playersSummary: {
    width: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  playerRole: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    width: 55,
  },
  playerName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  buttonGroup: {
    width: '100%',
    gap: 10,
  },
  aiReviewBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: '#818CF8',
  },
  aiReviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  aiReviewSparkle: {
    fontSize: 16,
  },
  aiReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  ghostBtnText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
