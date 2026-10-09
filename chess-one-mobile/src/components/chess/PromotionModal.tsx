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
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F3642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#9CA3AF',
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
    backgroundColor: '#272E38',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    color: '#D1D5DB',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: COLORS.border,
    alignItems: 'center',
  },
  cancelText: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
  },
});
