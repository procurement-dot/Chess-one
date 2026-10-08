import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { PieceSymbol, Color } from 'chess.js';
import { ChessPiece } from './ChessPiece';

interface PromotionModalProps {
  visible: boolean;
  color: Color;
  onSelect: (piece: PieceSymbol) => void;
  onCancel: () => void;
}

const PROMOTION_OPTIONS: { type: PieceSymbol; label: string }[] = [
  { type: 'q', label: 'Queen' },
  { type: 'n', label: 'Knight' },
  { type: 'r', label: 'Rook' },
  { type: 'b', label: 'Bishop' },
];

export const PromotionModal: React.FC<PromotionModalProps> = ({
  visible,
  color,
  onSelect,
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
          <Text style={styles.title}>Pawn Promotion</Text>
          <Text style={styles.subtitle}>Select a piece to promote your pawn:</Text>

          <View style={styles.piecesRow}>
            {PROMOTION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.type}
                style={styles.pieceButton}
                activeOpacity={0.7}
                onPress={() => onSelect(option.type)}
              >
                <View style={styles.piecePreview}>
                  <ChessPiece type={option.type} color={color} size={44} />
                </View>
                <Text style={styles.pieceLabel}>{option.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            activeOpacity={0.7}
            onPress={onCancel}
          >
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
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
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#74817A',
    marginBottom: 18,
    textAlign: 'center',
  },
  piecesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 18,
    gap: 8,
  },
  pieceButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#EEF3E8',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  piecePreview: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  pieceLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#202D29',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    alignItems: 'center',
  },
  cancelText: {
    color: '#74817A',
    fontSize: 14,
    fontWeight: '600',
  },
});
