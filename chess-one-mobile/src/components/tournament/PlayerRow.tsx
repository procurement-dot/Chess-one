import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, SIZES } from '../../constants/chessone-theme';
import type { TournamentPlayer } from '../../types/tournament.types';

interface PlayerRowProps {
  index: number;
  player: TournamentPlayer;
  isCurrentUser: boolean;
}

export function PlayerRow({ index, player, isCurrentUser }: PlayerRowProps) {
  const initial = player.name ? player.name.charAt(0).toUpperCase() : '?';

  return (
    <View style={[styles.row, isCurrentUser && styles.rowHighlighted]}>
      {/* Rank number */}
      <Text style={[styles.rankNumber, isCurrentUser && styles.rankNumberHighlighted]}>
        {index + 1}
      </Text>

      {/* Avatar or Initial Circle */}
      {player.avatarUrl ? (
        <Image source={{ uri: player.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.initialCircle, isCurrentUser && styles.initialCircleHighlighted]}>
          <Text style={[styles.initialText, isCurrentUser && styles.initialTextHighlighted]}>
            {initial}
          </Text>
        </View>
      )}

      {/* Name (+ You tag) */}
      <View style={styles.nameContainer}>
        <Text style={[styles.name, isCurrentUser && styles.nameHighlighted]} numberOfLines={1}>
          {player.name}
          {isCurrentUser ? ' (You)' : ''}
        </Text>
      </View>

      {/* Rating */}
      <View style={styles.ratingBadge}>
        <Text style={styles.ratingText}>{player.rating}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: SIZES.radiusButton,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 6,
  },
  rowHighlighted: {
    backgroundColor: COLORS.hero,
    borderColor: COLORS.progressFill,
  },
  rankNumber: {
    width: 24,
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textBody,
    textAlign: 'center',
    marginRight: 8,
  },
  rankNumberHighlighted: {
    color: COLORS.primary,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  initialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.boardLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  initialCircleHighlighted: {
    backgroundColor: COLORS.primary,
  },
  initialText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  initialTextHighlighted: {
    color: COLORS.white,
  },
  nameContainer: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  nameHighlighted: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  ratingBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
});
