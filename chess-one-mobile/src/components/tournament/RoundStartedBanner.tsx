import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SIZES } from '../../constants/chessone-theme';

export interface RoundStartedBannerProps {
  roundNumber: number;
  onDismiss: () => void;
  onGoToGame?: () => void;
  myGameId?: number | null;
  hasGame?: boolean;
}

export function RoundStartedBanner({
  roundNumber,
  onDismiss,
  onGoToGame,
  myGameId,
  hasGame = false,
}: RoundStartedBannerProps) {
  const router = useRouter();
  const effectiveHasGame = hasGame || Boolean(myGameId);

  const handleGoToGame = () => {
    if (onGoToGame) {
      onGoToGame();
    } else if (myGameId) {
      router.push(`/game/${myGameId}` as any);
    }
  };

  return (
    <View style={styles.banner}>
      <View style={styles.leftRow}>
        <Text style={styles.icon}>🏁</Text>
        <Text style={styles.text}>Round {roundNumber} has started!</Text>
      </View>

      <View style={styles.rightRow}>
        {effectiveHasGame && (
          <TouchableOpacity
            style={styles.gameLink}
            activeOpacity={0.7}
            onPress={handleGoToGame}
          >
            <Text style={styles.gameLinkText}>Go to game</Text>
            <Feather name="arrow-right" size={14} color="#15803D" />
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          onPress={onDismiss}
        >
          <Feather name="x" size={18} color="#15803D" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    borderRadius: SIZES.radiusCard,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 16,
    gap: 8,
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  icon: {
    fontSize: 16,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    flex: 1,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gameLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#BBF7D0',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: SIZES.radiusChip,
  },
  gameLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
  },
  closeButton: {
    padding: 2,
  },
});
