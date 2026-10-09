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

interface ResignConfirmModalProps {
  visible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResignConfirmModal: React.FC<ResignConfirmModalProps> = ({
  visible,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🏳️</Text>
          </View>

          <Text style={styles.title}>Resign Game</Text>
          <Text style={styles.message}>
            Are you sure you want to resign? You will immediately forfeit this match.
          </Text>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              activeOpacity={0.7}
              onPress={onCancel}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.resignButton]}
              activeOpacity={0.8}
              onPress={onConfirm}
            >
              <Text style={styles.resignText}>Resign</Text>
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
    borderColor: '#2F3642',
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
    backgroundColor: '#371E24',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconText: {
    fontSize: 26,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textBody,
    textAlign: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#262D38',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '600',
  },
  resignButton: {
    backgroundColor: '#EF4444',
  },
  resignText: {
    color: COLORS.textHeading,
    fontSize: 15,
    fontWeight: '700',
  },
});
