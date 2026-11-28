import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/chessone-theme';
import type { RoundStatus } from '../../types/tournament.types';

export interface RoundSelectorProps {
  totalRounds: number;
  selectedRound: number;
  onSelectRound: (roundNum: number) => void;
  rounds?: { roundNumber: number; status: RoundStatus }[];
  currentRound?: number;
}

export function RoundSelector({
  totalRounds,
  selectedRound,
  onSelectRound,
  rounds = [],
  currentRound,
}: RoundSelectorProps) {
  const roundNumbers = Array.from({ length: Math.max(totalRounds, 1) }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {roundNumbers.map((r) => {
          const roundInfo = rounds.find((rd) => rd.roundNumber === r);
          const exists =
            rounds.length > 0
              ? Boolean(roundInfo)
              : currentRound
              ? r <= currentRound
              : true;
          const isActive = roundInfo
            ? roundInfo.status === 'ACTIVE'
            : currentRound
            ? r === currentRound
            : false;
          const isSelected = selectedRound === r;

          return (
            <TouchableOpacity
              key={r}
              style={[
                styles.chip,
                isSelected && styles.selectedChip,
                !exists && styles.disabledChip,
              ]}
              disabled={!exists}
              activeOpacity={0.7}
              onPress={() => onSelectRound(r)}
            >
              <View style={styles.chipInner}>
                {isActive && <View style={styles.activeDot} />}
                <Text
                  style={[
                    styles.chipText,
                    isSelected
                      ? styles.selectedChipText
                      : exists
                      ? styles.enabledChipText
                      : styles.disabledChipText,
                  ]}
                >
                  R{r}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusButton,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  selectedChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledChip: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22C55E',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  selectedChipText: {
    color: COLORS.white,
  },
  enabledChipText: {
    color: COLORS.textHeading,
  },
  disabledChipText: {
    color: '#94A3B8',
  },
});
