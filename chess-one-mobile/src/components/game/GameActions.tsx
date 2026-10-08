import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GameActionsProps {
  onOfferDraw: () => void;
  onResign: () => void;
  onFlipBoard?: () => void;
  disabled?: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onOfferDraw,
  onResign,
  onFlipBoard,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      {onFlipBoard ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.flipButton]}
          activeOpacity={0.7}
          onPress={onFlipBoard}
          disabled={disabled}
        >
          <Text style={styles.buttonIcon}>🔄</Text>
          <Text style={styles.flipButtonText}>Flip</Text>
        </TouchableOpacity>
      ) : null}

      <TouchableOpacity
        style={[styles.actionButton, styles.drawButton, disabled && styles.disabledButton]}
        activeOpacity={0.7}
        onPress={onOfferDraw}
        disabled={disabled}
      >
        <Text style={styles.buttonIcon}>🤝</Text>
        <Text style={styles.drawButtonText}>Offer Draw</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.resignButton, disabled && styles.disabledButton]}
        activeOpacity={0.7}
        onPress={onResign}
        disabled={disabled}
      >
        <Text style={styles.buttonIcon}>🏳️</Text>
        <Text style={styles.resignButtonText}>Resign</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
  },
  buttonIcon: {
    fontSize: 16,
  },
  flipButton: {
    backgroundColor: '#F8FAFC',
    borderColor: '#CBD5E1',
    flex: 0.8,
  },
  flipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  drawButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  drawButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
  },
  resignButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  resignButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
