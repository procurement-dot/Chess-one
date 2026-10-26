import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../components/navigation/AppHeader';
import { TournamentStatusPill } from '../../components/tournament/TournamentStatusPill';
import { PlayerRow } from '../../components/tournament/PlayerRow';
import { TournamentActions } from '../../components/tournament/TournamentActions';
import { TournamentTabs, TournamentTabKey } from '../../components/tournament/TournamentTabs';
import { RoundSelector } from '../../components/tournament/RoundSelector';
import { PairingRow } from '../../components/tournament/PairingRow';
import { MyGameCard } from '../../components/tournament/MyGameCard';
import { RoundStartedBanner } from '../../components/tournament/RoundStartedBanner';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { useTournament } from '../../hooks/useTournament';
import { useTournamentRound } from '../../hooks/useTournamentRound';
import { useCan } from '../../hooks/useCan';
import { useAuthStore } from '../../store/authStore';
import { formatStartsAt } from '../../utils/tournament.utils';

export default function TournamentDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const tournamentId = id ? parseInt(id, 10) : null;

  const { user } = useAuthStore();
  const canJoinPerm = useCan('TOURNAMENT_JOIN');

  const {
    data,
    loading,
    error,
    refresh,
    join,
    leave,
    cancel,
    start,
    myGame,
    roundBanner,
    dismissRoundBanner,
    actionLoading,
    actionError,
  } = useTournament(tournamentId);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TournamentTabKey | null>(null);
  const [manuallySelectedRound, setManuallySelectedRound] = useState<number | null>(null);

  const isUpcoming = data?.tournament?.status === 'UPCOMING';

  // Active tab: user selection takes priority; otherwise default to 'players' for upcoming, 'pairings' for active/completed
  const activeTab: TournamentTabKey =
    selectedTab ?? (isUpcoming ? 'players' : 'pairings');

  // Selected round: round banner notification takes priority, followed by user manual selection, followed by current round
  const selectedRound =
    roundBanner?.roundNumber ??
    manuallySelectedRound ??
    (data?.tournament?.currentRound && data.tournament.currentRound > 0
      ? data.tournament.currentRound
      : 1);

  // Fetch pairings for selected round (only if tournament is not UPCOMING)
  const {
    round,
    loading: roundLoading,
    error: roundError,
    refresh: refreshRound,
  } = useTournamentRound(isUpcoming ? null : tournamentId, selectedRound);

  const handleTabChange = (tab: TournamentTabKey) => {
    setSelectedTab(tab);
  };

  const handleSelectRound = (r: number) => {
    setManuallySelectedRound(r);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refresh();
      if (!isUpcoming) {
        await refreshRound();
      }
    } finally {
      setRefreshing(false);
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator color={COLORS.primary} size="large" />
        <Text style={styles.loadingText}>Loading tournament...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.container}>
        <AppHeader title="Tournament" showBack={true} onBack={() => router.replace('/tournaments' as any)} />
        <View style={styles.centerContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Tournament Not Found</Text>
          <Text style={styles.errorSub}>{error || 'The requested tournament does not exist.'}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.replace('/tournaments' as any)}
          >
            <Text style={styles.backButtonText}>Back to Tournaments</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const { tournament, players, isJoined } = data;
  const isCancelled = tournament.status === 'CANCELLED';
  const formatText = tournament.format === 'ROUND_ROBIN' ? 'Round Robin' : 'Swiss';

  const headerSubtitle =
    tournament.status === 'ACTIVE'
      ? `Round ${tournament.currentRound || 1} of ${tournament.totalRounds}`
      : tournament.status === 'COMPLETED'
      ? `Completed · ${tournament.totalRounds} Rounds`
      : formatStartsAt(tournament.startsAt);

  const emptyPlayersText = canJoinPerm
    ? 'No players yet — be the first to join!'
    : 'No players yet';

  return (
    <View style={styles.container}>
      <AppHeader
        title={tournament.name}
        subtitle={headerSubtitle}
        showBack={true}
        onBack={() => router.replace('/tournaments' as any)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Round Started Live Socket Banner */}
        {roundBanner && (
          <RoundStartedBanner
            roundNumber={roundBanner.roundNumber}
            myGameId={myGame?.gameId}
            onDismiss={dismissRoundBanner}
          />
        )}

        {/* Status Banners */}
        {isCancelled ? (
          <View style={styles.cancelledBanner}>
            <Text style={styles.cancelledBannerIcon}>⚠️</Text>
            <Text style={styles.cancelledBannerText}>This tournament was cancelled</Text>
          </View>
        ) : isJoined && tournament.status === 'UPCOMING' ? (
          <View style={styles.joinedBanner}>
            <Text style={styles.joinedBannerIcon}>🎉</Text>
            <Text style={styles.joinedBannerText}>
              {"You're in! It starts " + formatStartsAt(tournament.startsAt)}
            </Text>
          </View>
        ) : null}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoCardTop}>
            <Text style={styles.tournamentTitle}>{tournament.name}</Text>
            <TournamentStatusPill status={tournament.status} />
          </View>

          {tournament.description ? (
            <Text style={styles.description}>{tournament.description}</Text>
          ) : null}

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Feather name="calendar" size={15} color={COLORS.textBody} />
              <View>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>{formatStartsAt(tournament.startsAt)}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Feather name="clock" size={15} color={COLORS.textBody} />
              <View>
                <Text style={styles.metaLabel}>Time Control</Text>
                <Text style={styles.metaValue}>{tournament.timeControl}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Feather name="grid" size={15} color={COLORS.textBody} />
              <View>
                <Text style={styles.metaLabel}>Format</Text>
                <Text style={styles.metaValue}>{formatText}</Text>
              </View>
            </View>

            <View style={styles.metaItem}>
              <Feather name="award" size={15} color={COLORS.textBody} />
              <View>
                <Text style={styles.metaLabel}>Rating</Text>
                <Text style={styles.metaValue}>
                  {tournament.isRated ? 'Rated (Elo)' : 'Unrated'}
                </Text>
              </View>
            </View>

            <View style={styles.metaItemFull}>
              <Feather name="user" size={15} color={COLORS.textBody} />
              <View>
                <Text style={styles.metaLabel}>Organiser</Text>
                <Text style={styles.metaValue}>{tournament.organiser.name}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Active Participant My Game Card */}
        {myGame && (
          <View style={styles.myGameSection}>
            <MyGameCard
              myGame={myGame}
              onGoToGame={(gameId) => router.push(`/game/${gameId}` as any)}
            />
          </View>
        )}

        {/* Segmented Control Tabs */}
        <TournamentTabs
          activeTab={activeTab}
          onChange={handleTabChange}
          playerCount={tournament.playerCount}
          pairingsDisabled={tournament.status === 'UPCOMING'}
        />

        {/* Tab Content */}
        {activeTab === 'players' ? (
          <View style={styles.tabContentSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Players ({tournament.playerCount} / {tournament.maxPlayers})
              </Text>
            </View>

            {players.length === 0 ? (
              <View style={styles.emptyPlayersCard}>
                <Text style={styles.emptyPlayersIcon}>♟️</Text>
                <Text style={styles.emptyPlayersText}>{emptyPlayersText}</Text>
              </View>
            ) : (
              players.map((p, idx) => (
                <PlayerRow
                  key={p.userId}
                  index={idx}
                  player={p}
                  isCurrentUser={Number(p.userId) === Number(user?.id)}
                />
              ))
            )}
          </View>
        ) : (
          <View style={styles.tabContentSection}>
            {/* Round Selector Chips */}
            <RoundSelector
              totalRounds={tournament.totalRounds || 1}
              currentRound={tournament.currentRound || 1}
              rounds={data.rounds || []}
              selectedRound={selectedRound}
              onSelectRound={handleSelectRound}
            />

            {/* Pairings Content for Selected Round */}
            {roundLoading && !round ? (
              <View style={styles.roundCenterBox}>
                <ActivityIndicator color={COLORS.primary} size="small" />
                <Text style={styles.roundLoadingText}>Loading pairings...</Text>
              </View>
            ) : roundError ? (
              <View style={styles.roundCenterBox}>
                <Text style={styles.roundErrorText}>{roundError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={refreshRound}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : !round?.pairings || round.pairings.length === 0 ? (
              <View style={styles.emptyPairingsCard}>
                <Text style={styles.emptyPairingsIcon}>⚔️</Text>
                <Text style={styles.emptyPairingsText}>
                  No pairings generated yet for Round {selectedRound}
                </Text>
              </View>
            ) : (
              <View style={styles.pairingsList}>
                {round.pairings.map((pairing) => (
                  <PairingRow
                    key={pairing.id}
                    pairing={pairing}
                    currentUserId={user?.id ? Number(user.id) : null}
                    onPressGame={(gameId: number) => router.push(`/game/${gameId}` as any)}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Actions */}
      <TournamentActions
        data={data}
        onJoin={join}
        onLeave={leave}
        onCancel={cancel}
        onStart={start}
        actionLoading={actionLoading}
        actionError={actionError}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textBody,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 4,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  errorSub: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: SIZES.radiusButton,
    marginTop: 12,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  cancelledBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: SIZES.radiusButton,
    marginBottom: 16,
    gap: 8,
  },
  cancelledBannerIcon: {
    fontSize: 18,
  },
  cancelledBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
  joinedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hero,
    borderWidth: 1,
    borderColor: COLORS.progressFill,
    padding: 12,
    borderRadius: SIZES.radiusButton,
    marginBottom: 16,
    gap: 8,
  },
  joinedBannerIcon: {
    fontSize: 18,
  },
  joinedBannerText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  infoCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  tournamentTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  description: {
    fontSize: 14,
    color: COLORS.textBody,
    marginTop: 10,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 14,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '47%',
  },
  metaItemFull: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 2,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textBody,
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  metaValue: {
    fontSize: 13,
    color: COLORS.textHeading,
    fontWeight: '700',
    marginTop: 2,
  },
  myGameSection: {
    marginBottom: 16,
  },
  tabContentSection: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  emptyPlayersCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyPlayersIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyPlayersText: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
  },
  roundCenterBox: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    marginTop: 8,
  },
  roundLoadingText: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  roundErrorText: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyPairingsCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  emptyPairingsIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyPairingsText: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
  },
  pairingsList: {
    marginTop: 4,
  },
});
