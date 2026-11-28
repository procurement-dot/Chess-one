import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../constants/chessone-theme';

interface StartTournamentModalProps {
  visible: boolean;
  tournamentName: string;
  playerCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function StartTournamentModal({
  visible,
  tournamentName,
  playerCount,
  onConfirm,
  onCancel,
  loading = false,
}: StartTournamentModalProps) {
  const roundCount = playerCount % 2 === 0 ? playerCount - 1 : playerCount;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={loading ? undefined : onCancel}
    >
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🏆</Text>
          </View>

          <Text style={styles.title}>Start {tournamentName}?</Text>
          <Text style={styles.message}>
            {playerCount} players · {roundCount} rounds · round robin.{'\n'}
            Players can&apos;t join or leave after this.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              disabled={loading}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.startButton]}
              disabled={loading}
              activeOpacity={0.8}
              onPress={onConfirm}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.startText}>Start Tournament</Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  startButton: {
    backgroundColor: COLORS.primary,
  },
  startText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
});
