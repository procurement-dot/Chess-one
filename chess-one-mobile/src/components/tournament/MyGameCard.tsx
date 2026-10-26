import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import type { MyGame } from '../../types/tournament.types';

interface MyGameCardProps {
  myGame: MyGame | null;
  onGoToGame?: (gameId: number) => void;
}

export function MyGameCard({ myGame, onGoToGame }: MyGameCardProps) {
  const router = useRouter();

  if (!myGame) return null;

  // Bye Scenario
  if (myGame.bye) {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconCircleBye}>
            <Text style={styles.iconText}>🏖️</Text>
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.title}>Round {myGame.roundNumber} · Bye</Text>
            <Text style={styles.subtext}>
              You have a bye this round (+1 point). Relax!
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // No active board assigned yet
  if (!myGame.gameId) {
    return null;
  }

  const isGameActive = myGame.gameStatus === 'ACTIVE';

  const handlePress = () => {
    if (onGoToGame) {
      onGoToGame(myGame.gameId);
    } else {
      router.push(`/game/${myGame.gameId}` as any);
    }
  };

  if (!isGameActive) {
    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={styles.iconCircleFinished}>
            <Feather name="check-circle" size={22} color="#15803D" />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.title}>Round {myGame.roundNumber} Game Finished</Text>
            <Text style={styles.subtext}>
              Your round {myGame.roundNumber} game is finished. Waiting for other boards…
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.cardActive}>
      <View style={styles.topRow}>
        <View style={styles.iconCircleActive}>
          <Text style={styles.iconText}>♟️</Text>
        </View>
        <View style={styles.infoCol}>
          <Text style={styles.titleActive}>
            Round {myGame.roundNumber} · Board {myGame.boardNumber}
          </Text>
          <Text style={styles.subtextActive}>
            You play{' '}
            <Text style={styles.boldText}>
              {myGame.color === 'WHITE' ? 'White' : 'Black'}
            </Text>{' '}
            vs {myGame.opponent?.name} ({myGame.opponent?.rating})
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        activeOpacity={0.8}
        onPress={handlePress}
      >
        <Text style={styles.actionButtonText}>Go to my game</Text>
        <Feather name="arrow-right" size={16} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardActive: {
    backgroundColor: '#F0FDF4',
    borderRadius: SIZES.radiusCard,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    ...SHADOWS.soft,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircleActive: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleFinished: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleBye: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },
  infoCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  titleActive: {
    fontSize: 15,
    fontWeight: '800',
    color: '#15803D',
    marginBottom: 2,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  subtextActive: {
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '800',
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusInput,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 12,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
