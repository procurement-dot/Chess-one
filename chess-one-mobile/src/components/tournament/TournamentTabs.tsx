import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES } from '../../constants/chessone-theme';

export type TournamentTabKey = 'players' | 'pairings';
export type TournamentTabType = TournamentTabKey;

export interface TournamentTabsProps {
  activeTab: TournamentTabKey;
  onChange?: (tab: TournamentTabKey) => void;
  onTabChange?: (tab: TournamentTabKey) => void;
  playerCount: number;
  isUpcoming?: boolean;
  pairingsDisabled?: boolean;
}

export function TournamentTabs({
  activeTab,
  onChange,
  onTabChange,
  playerCount,
  isUpcoming = false,
  pairingsDisabled = false,
}: TournamentTabsProps) {
  const disabled = isUpcoming || pairingsDisabled;

  const handleSelect = (tab: TournamentTabKey) => {
    if (onChange) {
      onChange(tab);
    }
    if (onTabChange) {
      onTabChange(tab);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'players' && styles.activeTab]}
        activeOpacity={0.7}
        onPress={() => handleSelect('players')}
      >
        <Text
          style={[
            styles.tabText,
            activeTab === 'players' ? styles.activeTabText : styles.inactiveTabText,
          ]}
        >
          Players ({playerCount})
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTab === 'pairings' && styles.activeTab,
          disabled && styles.disabledTab,
        ]}
        disabled={disabled}
        activeOpacity={0.7}
        onPress={() => handleSelect('pairings')}
      >
        <Text
          style={[
            styles.tabText,
            disabled
              ? styles.disabledTabText
              : activeTab === 'pairings'
              ? styles.activeTabText
              : styles.inactiveTabText,
          ]}
        >
          Pairings
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#EEF2E6',
    borderRadius: SIZES.radiusInput,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: SIZES.radiusInput - 2,
  },
  activeTab: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  disabledTab: {
    opacity: 0.45,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabText: {
    color: COLORS.primary,
  },
  inactiveTabText: {
    color: COLORS.textBody,
  },
  disabledTabText: {
    color: '#94A3B8',
  },
});
