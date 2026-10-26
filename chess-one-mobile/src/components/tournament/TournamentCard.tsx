import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { TournamentStatusPill } from './TournamentStatusPill';
import { formatStartsAt } from '../../utils/tournament.utils';
import type { TournamentListItem } from '../../types/tournament.types';

interface TournamentCardProps {
  tournament: TournamentListItem;
}

export function TournamentCard({ tournament }: TournamentCardProps) {
  const router = useRouter();

  const handlePress = () => {
    router.push(`/tournaments/${tournament.id}` as any);
  };

  const progress =
    tournament.maxPlayers > 0
      ? Math.min(1, Math.max(0, tournament.playerCount / tournament.maxPlayers))
      : 0;

  const formatText = tournament.format === 'ROUND_ROBIN' ? 'Round robin' : 'Swiss';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onPress={handlePress}
    >
      {/* Row 1: Name + Status */}
      <View style={styles.rowTop}>
        <Text style={styles.name} numberOfLines={1}>
          {tournament.name}
        </Text>
        <TournamentStatusPill status={tournament.status} />
      </View>

      {/* Row 2: Date · Time control · Format */}
      <Text style={styles.metaText}>
        {formatStartsAt(tournament.startsAt)} · {tournament.timeControl} · {formatText}
      </Text>

      {/* Row 3: Player count progress bar + Chips */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBarWrapper}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.playerCountText}>
            {tournament.playerCount} / {tournament.maxPlayers} players
          </Text>
        </View>

        <View style={styles.chipsRow}>
          {tournament.isJoined && (
            <View style={styles.joinedChip}>
              <Text style={styles.joinedChipText}>Joined</Text>
            </View>
          )}
          {tournament.isOwner && (
            <View style={styles.ownerChip}>
              <Text style={styles.ownerChipText}>Yours</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    gap: 10,
  },
  rowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    flex: 1,
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  progressBarWrapper: {
    flex: 1,
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.progressFill,
    borderRadius: 3,
  },
  playerCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  joinedChip: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusChip,
  },
  joinedChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ownerChip: {
    backgroundColor: COLORS.warmCream,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: SIZES.radiusChip,
  },
  ownerChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
});
