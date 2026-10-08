import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

interface GameActionsProps {
  onOfferDraw: () => void;
  onResign: () => void;
  onAbort?: () => void;
  canAbort?: boolean;
  abortCountdown?: number | null;
  onFlipBoard?: () => void;
  disabled?: boolean;
}

export const GameActions: React.FC<GameActionsProps> = ({
  onOfferDraw,
  onResign,
  onAbort,
  canAbort = false,
  abortCountdown,
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

      {canAbort && onAbort ? (
        <TouchableOpacity
          style={[styles.actionButton, styles.abortButton, disabled && styles.disabledButton]}
          activeOpacity={0.7}
          onPress={onAbort}
          disabled={disabled}
        >
          <Text style={styles.buttonIcon}>🛑</Text>
          <Text style={styles.abortButtonText}>
            Abort Match{abortCountdown ? ` (${abortCountdown}s)` : ''}
          </Text>
        </TouchableOpacity>
      ) : (
        <>
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
        </>
      )}
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
    backgroundColor: '#EEF3E8',
    borderColor: '#D5DFC8',
    flex: 0.8,
  },
  flipButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#194E40',
  },
  abortButton: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
    flex: 2,
  },
  abortButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#C53030',
  },
  drawButton: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  drawButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#194E40',
  },
  resignButton: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
  },
  resignButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#C53030',
  },
  disabledButton: {
    opacity: 0.5,
  },
});
