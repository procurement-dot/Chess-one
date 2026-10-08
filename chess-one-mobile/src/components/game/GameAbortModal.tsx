import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
} from 'react-native';

interface GameAbortModalProps {
  visible: boolean;
  reason?: 'FIRST_MOVE_TIMEOUT' | 'DISCONNECTED' | string;
  onGoHome: () => void;
  onNewMatch: () => void;
}

export const GameAbortModal: React.FC<GameAbortModalProps> = ({
  visible,
  reason = 'FIRST_MOVE_TIMEOUT',
  onGoHome,
  onNewMatch,
}) => {
  if (!visible) return null;

  const isTimeout = reason === 'FIRST_MOVE_TIMEOUT';
  const isDisconnected = reason === 'DISCONNECTED';

  const title = isDisconnected
    ? 'Connection Lost'
    : isTimeout
    ? 'Match Auto-Aborted'
    : 'Match Aborted';

  const icon = isDisconnected ? '📡' : '⏱️';

  const description = isDisconnected
    ? 'Internet connection was lost during the match. The game has been automatically aborted to maintain fairness.'
    : isTimeout
    ? 'No move was played within the initial 10-second countdown. The match was automatically aborted.'
    : 'The match has been cancelled and aborted.';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onGoHome}
    >
      <Pressable style={styles.backdrop} onPress={onGoHome}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>{icon}</Text>
          </View>

          {/* Title & Description */}
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.desc}>{description}</Text>

          {/* Rating Protection Badge */}
          <View style={styles.shieldBadge}>
            <Text style={styles.shieldIcon}>🛡️</Text>
            <Text style={styles.shieldText}>
              Ratings Unaffected • Fair-play protected
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsColumn}>
            <TouchableOpacity
              style={styles.newMatchBtn}
              activeOpacity={0.85}
              onPress={onNewMatch}
            >
              <Text style={styles.newMatchBtnText}>⚔️ Play Another Match</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              activeOpacity={0.8}
              onPress={onGoHome}
            >
              <Text style={styles.homeBtnText}>🏠 Return to Home</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#161B22',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#374151',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 21,
    fontWeight: '800',
    color: '#F87171',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 13.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 20,
    gap: 8,
  },
  shieldIcon: {
    fontSize: 14,
  },
  shieldText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#7DD3FC',
  },
  actionsColumn: {
    width: '100%',
    gap: 10,
  },
  newMatchBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  newMatchBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  homeBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#1E232A',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F3642',
  },
  homeBtnText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
  },
});
