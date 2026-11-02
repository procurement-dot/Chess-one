import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';

export interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'large';
}

export function LoadingState({ message = 'Loading...', size = 'large' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={COLORS.primary} />
        {Boolean(message) && <Text style={styles.message}>{message}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  content: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    gap: 16,
  },
  message: {
    fontSize: SIZES.fontBody,
    color: COLORS.textBody,
    fontWeight: '600',
    textAlign: 'center',
  },
});
