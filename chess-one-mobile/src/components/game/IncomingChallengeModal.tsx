import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { GameInvitation } from '../../types/game.types';

interface IncomingChallengeModalProps {
  visible: boolean;
  invitation: GameInvitation | null;
  isProcessing: boolean;
  onAccept: (invitationId: number) => void;
  onDecline: (invitationId: number) => void;
  onDismiss: () => void;
}

export const IncomingChallengeModal: React.FC<IncomingChallengeModalProps> = ({
  visible,
  invitation,
  isProcessing,
  onAccept,
  onDecline,
  onDismiss,
}) => {
  if (!visible || !invitation) return null;

  const senderName = invitation.sender?.name || invitation.sender?.email || 'A Player';
  const initial = senderName[0].toUpperCase();

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>⚔️</Text>
          </View>

          <Text style={styles.title}>New Match Challenge!</Text>
          <Text style={styles.subtitle}>You have been invited to a live match</Text>

          {/* Challenger Box */}
          <View style={styles.challengerBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={styles.challengerInfo}>
              <Text style={styles.challengerName} numberOfLines={1}>
                {senderName}
              </Text>
              <Text style={styles.challengerDetails}>
                ⏱️ {invitation.timeControl || invitation.game?.timeControl || '5+0'} • ID: #{invitation.sender?.id}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonCol}>
            <TouchableOpacity
              style={[styles.acceptBtn, isProcessing && styles.btnDisabled]}
              activeOpacity={0.85}
              onPress={() => onAccept(invitation.id)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.acceptBtnText}>✅ Accept Challenge</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.declineBtn, isProcessing && styles.btnDisabled]}
              activeOpacity={0.75}
              onPress={() => onDecline(invitation.id)}
              disabled={isProcessing}
            >
              <Text style={styles.declineBtnText}>❌ Decline</Text>
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
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#161B22',
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#30363D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#312E81',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6366F1',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 32,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    textAlign: 'center',
  },
  challengerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F1318',
    padding: 14,
    borderRadius: 14,
    width: '100%',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#262D38',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  challengerInfo: {
    flex: 1,
  },
  challengerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 3,
  },
  challengerDetails: {
    fontSize: 12,
    color: '#94A3B8',
  },
  buttonCol: {
    width: '100%',
    gap: 10,
  },
  acceptBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  acceptBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  declineBtn: {
    backgroundColor: '#1E232A',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#374151',
  },
  declineBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '600',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});
