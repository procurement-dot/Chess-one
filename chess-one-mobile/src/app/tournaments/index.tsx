import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { useTournaments, TournamentFilter } from '../../hooks/useTournaments';
import { useCan } from '../../hooks/useCan';
import { useRoleStore } from '../../features/roles/roleStore';
import { TournamentCard } from '../../components/tournament/TournamentCard';
import type { TournamentListItem } from '../../types/tournament.types';

const CHIPS: { label: string; filter: TournamentFilter }[] = [
  { label: 'Upcoming', filter: 'UPCOMING' },
  { label: 'Active', filter: 'ACTIVE' },
  { label: 'My tournaments', filter: 'MINE' },
];

export default function TournamentsScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState<TournamentFilter>('UPCOMING');
  const activeRole = useRoleStore();
  const canCreateTournament = useCan('TOURNAMENT_CREATE') && activeRole === 'Organizer';

  const { tournaments, loading, refreshing, error, refresh } = useTournaments(activeChip);

  const getEmptyMessage = () => {
    switch (activeChip) {
      case 'UPCOMING':
        return 'No upcoming tournaments yet.';
      case 'ACTIVE':
        return 'No active tournaments right now.';
      case 'MINE':
        return "You haven't joined or created any tournaments yet.";
    }
  };

  const renderEmptyComponent = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={refresh}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🏆</Text>
        <Text style={styles.emptyText}>{getEmptyMessage()}</Text>
        {canCreateTournament && (
          <TouchableOpacity
            style={styles.emptyCreateBtn}
            onPress={() => router.push('/tournaments/create' as any)}
          >
            <Feather name="plus" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
            <Text style={styles.emptyCreateBtnText}>Create tournament</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderItem = ({ item }: { item: TournamentListItem }) => (
    <View style={styles.cardItemWrapper}>
      <TournamentCard tournament={item} />
    </View>
  );

  return (
    <View style={styles.container}>
      <AppHeader
        title="Tournaments"
        subtitle="Compete and shine"
        extraRightAction={
          canCreateTournament ? (
            <TouchableOpacity
              style={styles.headerCreateBtn}
              activeOpacity={0.8}
              onPress={() => router.push('/tournaments/create' as any)}
            >
              <Feather name="plus" size={14} color={COLORS.white} style={{ marginRight: 4 }} />
              <Text style={styles.headerCreateBtnText}>Create</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      {/* Filter Chips */}
      <View style={styles.chipScrollWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScroll}
        >
          {CHIPS.map((chip) => {
            const isActive = activeChip === chip.filter;
            return (
              <TouchableOpacity
                key={chip.filter}
                style={[styles.chip, isActive && styles.activeChip]}
                onPress={() => setActiveChip(chip.filter)}
              >
                <Text style={[styles.chipText, isActive && styles.activeChipText]}>
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={COLORS.primary} size="large" />
          <Text style={styles.loadingText}>Loading tournaments...</Text>
        </View>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.contentList}
          ListEmptyComponent={renderEmptyComponent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
        />
      )}

      {/* Floating Action Button for Organisers */}
      {canCreateTournament && (
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => router.push('/tournaments/create' as any)}
        >
          <Feather name="plus" size={20} color={COLORS.white} />
          <Text style={styles.fabText}>Create</Text>
        </TouchableOpacity>
      )}

      <AppFooter activeTab="tournaments" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusChip,
    marginRight: 6,
  },
  headerCreateBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  chipScrollWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: SIZES.radiusChip,
    backgroundColor: COLORS.background,
  },
  activeChip: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  activeChipText: {
    color: COLORS.white,
  },
  contentList: {
    padding: 16,
    paddingBottom: 100,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  cardItemWrapper: {
    marginBottom: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textBody,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 15,
    color: COLORS.textBody,
    textAlign: 'center',
  },
  emptyCreateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: SIZES.radiusButton,
    marginTop: 8,
  },
  emptyCreateBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  errorIcon: {
    fontSize: 32,
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: SIZES.radiusButton,
    marginTop: 4,
  },
  retryBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 84,
    right: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    gap: 6,
    ...SHADOWS.soft,
  },
  fabText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
});
