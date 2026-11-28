import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { statusColors, statusLabel } from '../../utils/tournament.utils';
import type { TournamentStatus } from '../../types/tournament.types';

interface TournamentStatusPillProps {
  status: TournamentStatus;
}

export function TournamentStatusPill({ status }: TournamentStatusPillProps) {
  const colors = statusColors(status);
  const label = statusLabel(status);

  return (
    <View style={[styles.pill, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
