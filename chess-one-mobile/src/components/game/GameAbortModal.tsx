import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Image,
} from 'react-native';

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');

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
    ? 'Match Aborted'
    : 'Match Aborted';

  const icon = isDisconnected ? '📡' : '⏱️';

  const description = isDisconnected
    ? 'Internet connection was lost during the match. The game has been automatically aborted to maintain fairness.'
    : isTimeout
    ? 'No moves were played within 10 seconds. The match has been automatically stopped to maintain fairness.'
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
          {/* Official Brand Logo */}
          <Image
            source={logoBanner}
            style={styles.brandLogo}
            resizeMode="contain"
          />

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
    backgroundColor: 'rgba(32, 45, 41, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  brandLogo: {
    width: 110,
    height: 38,
    marginBottom: 10,
    alignSelf: 'center',
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#FCEDDF',
    borderWidth: 2,
    borderColor: '#F7A18C',
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
    color: '#C53030',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  desc: {
    fontSize: 13.5,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3E8',
    borderWidth: 1,
    borderColor: '#D5DFC8',
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
    fontWeight: '700',
    color: '#194E40',
  },
  actionsColumn: {
    width: '100%',
    gap: 10,
  },
  newMatchBtn: {
    width: '100%',
    height: 48,
    backgroundColor: '#194E40',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
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
    backgroundColor: '#EEF3E8',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  homeBtnText: {
    color: '#194E40',
    fontSize: 13,
    fontWeight: '700',
  },
});
