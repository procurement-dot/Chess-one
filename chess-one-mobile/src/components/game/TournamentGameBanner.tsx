import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../constants/chessone-theme';

export interface TournamentGameBannerProps {
  tournament: {
    id: number;
    name: string;
    roundNumber: number;
    boardNumber: number;
  };
  onPress?: () => void;
}

export const TournamentGameBanner: React.FC<TournamentGameBannerProps> = ({
  tournament,
  onPress,
}) => {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/tournaments/${tournament.id}` as any);
    }
  };

  return (
    <TouchableOpacity
      style={styles.banner}
      activeOpacity={0.8}
      onPress={handlePress}
    >
      <View style={styles.leftContent}>
        <Text style={styles.trophyIcon}>🏆</Text>
        <View style={styles.textContainer}>
          <Text style={styles.tournamentName} numberOfLines={1}>
            {tournament.name}
          </Text>
          <Text style={styles.detailsText}>
            Round {tournament.roundNumber} · Board {tournament.boardNumber}
          </Text>
        </View>
      </View>
      <View style={styles.rightContent}>
        <Text style={styles.viewLink}>View</Text>
        <Text style={styles.chevron}>›</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  trophyIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  tournamentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  detailsText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#94A3B8',
    marginTop: 2,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewLink: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    marginRight: 4,
  },
  chevron: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
});
