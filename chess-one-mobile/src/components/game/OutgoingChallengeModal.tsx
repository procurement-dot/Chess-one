import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { OnlineUser } from '../../types/game.types';

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');

interface OutgoingChallengeModalProps {
  visible: boolean;
  targetUser: OnlineUser | null;
  status: 'sending' | 'waiting' | 'declined' | 'error';
  timeControl?: string;
  errorMessage?: string;
  onCancel: () => void;
}

export const OutgoingChallengeModal: React.FC<OutgoingChallengeModalProps> = ({
  visible,
  targetUser,
  status,
  timeControl = '5 min Blitz',
  errorMessage,
  onCancel,
}) => {
  if (!visible || !targetUser) return null;

  const opponentName = targetUser.name || targetUser.email || 'Player';

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Official Brand Logo */}
          <Image
            source={logoBanner}
            style={styles.brandLogo}
            resizeMode="contain"
          />

          {/* Status Icon */}
          <View style={styles.iconCircle}>
            {status === 'waiting' || status === 'sending' ? (
              <ActivityIndicator size="large" color="#194E40" />
            ) : status === 'declined' ? (
              <Text style={styles.iconText}>🛑</Text>
            ) : (
              <Text style={styles.iconText}>⚠️</Text>
            )}
          </View>

          {/* Heading */}
          <Text style={styles.title}>
            {status === 'waiting'
              ? '📩 Invitation Sent!'
              : status === 'sending'
              ? 'Sending Challenge...'
              : status === 'declined'
              ? 'Challenge Declined'
              : 'Challenge Failed'}
          </Text>

          <Text style={styles.subtitle}>
            {status === 'waiting'
              ? `Waiting for ${opponentName} to accept your challenge. The match face-off will start automatically!`
              : status === 'sending'
              ? `Sending invitation to ${opponentName}...`
              : status === 'declined'
              ? `${opponentName} declined your chess challenge.`
              : errorMessage || 'Could not send invitation.'}
          </Text>

          {/* Opponent Card Preview */}
          <View style={styles.previewBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{opponentName[0].toUpperCase()}</Text>
            </View>
            <View style={styles.previewInfo}>
              <Text style={styles.previewName}>{opponentName}</Text>
              <Text style={styles.previewSub}>
                ID: #{targetUser.id} • ⏱️ {timeControl}
              </Text>
            </View>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={styles.cancelBtn}
            activeOpacity={0.8}
            onPress={onCancel}
          >
            <Text style={styles.cancelBtnText}>
              {status === 'declined' || status === 'error' ? 'Dismiss' : 'Cancel Challenge'}
            </Text>
          </TouchableOpacity>
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
    maxWidth: 360,
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
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D5DFC8',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#74817A',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 19,
  },
  previewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
    padding: 12,
    borderRadius: 14,
    width: '100%',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#194E40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  previewInfo: {
    flex: 1,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 2,
  },
  previewSub: {
    fontSize: 11,
    color: '#74817A',
  },
  cancelBtn: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  cancelBtnText: {
    color: '#C53030',
    fontSize: 14,
    fontWeight: '700',
  },
});
