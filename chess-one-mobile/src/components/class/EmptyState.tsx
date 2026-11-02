import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';

export interface EmptyStateProps {
  title: string;
  message?: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  message,
  icon,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {icon || <Text style={styles.defaultIcon}>📚</Text>}
        </View>

        <Text style={styles.title}>{title}</Text>

        {Boolean(message) && <Text style={styles.message}>{message}</Text>}

        {Boolean(actionLabel && onAction) && (
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onAction}
            accessibilityRole="button"
            accessibilityLabel={actionLabel}
          >
            <Text style={styles.buttonText}>{actionLabel}</Text>
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
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.hero,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  defaultIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 18,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
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
    minWidth: 140,
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
