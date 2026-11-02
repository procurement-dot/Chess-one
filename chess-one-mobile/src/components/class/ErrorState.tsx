import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { getErrorMessage } from '../../utils/classErrors';

export interface ErrorStateProps {
  error?: unknown;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ error, message, onRetry }: ErrorStateProps) {
  const displayMessage = message || getErrorMessage(error);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>⚠️</Text>
        </View>

        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.message}>{displayMessage}</Text>

        {Boolean(onRetry) && (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onRetry}
            accessibilityRole="button"
            accessibilityLabel="Try Again"
          >
            <Text style={styles.buttonText}>Try Again</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 480,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 24,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    ...SHADOWS.soft,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: FONTS.headingWeight,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: SIZES.fontBody,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 130,
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
