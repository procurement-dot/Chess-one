import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { gameService } from '../../services/game.service';
import { useAuthStore } from '../../store/authStore';
import { Game } from '../../types/game.types';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';

// AI Coach contextual advice for losses
const getAiCoachSuggestion = (game: Game, isUserWhite: boolean): string => {
  if (game.result === 'TIMEOUT') {
    return '⏱️ Clock Awareness: Pace your moves steadily in the opening so you keep ample time for complex tactics.';
  }
  if (game.result === 'RESIGNATION') {
    return '🛡️ Resilience: Even in difficult positions, look for defensive counter-punches or stalemate tricks before resigning.';
  }
  if (game.result === 'CHECKMATE') {
    return isUserWhite
      ? '👑 King Safety: Remember to castle early and avoid leaving your f2/g2 pawns vulnerable to quick attacks.'
      : '👑 King Safety: Watch out for back-rank threats and coordinate your rooks to maintain king defense.';
  }
  if (game.result === 'DRAW' || game.result === 'STALEMATE') {
    return '🤝 Solid Defense: Great tenacity fighting back to secure a draw in an equal endgame!';
  }
  return '🧠 Tactical Vision: Scan the board for undefended pieces before every move to prevent unexpected tactics.';
};

export default function MatchHistoryScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const currentUserId = user?.id ? parseInt(user.id, 10) : null;

  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      const list = await gameService.getMyGames();
      setGames(list.games || []);
    } catch (err) {
      console.warn('Failed to load games:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  const handleGamePress = (game: Game) => {
    if (game.status === 'COMPLETED') {
      router.push(`/game/result/${game.id}` as any);
    } else {
      router.push(`/game/${game.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Match History"
        subtitle="Your completed & active games"
        showBack={true}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchGames}
            tintColor="#194E40"
          />
        }
      >
        {isLoading && games.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#194E40" />
            <Text style={styles.loadingText}>Loading match history...</Text>
          </View>
        ) : games.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>♟️</Text>
            <Text style={styles.emptyTitle}>No games played yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a game against the computer or challenge a friend to see your match history here.
            </Text>
            <TouchableOpacity
              style={styles.startBtn}
              activeOpacity={0.85}
              onPress={() => router.push('/play/create' as any)}
            >
              <Text style={styles.startBtnText}>Start a Match</Text>
            </TouchableOpacity>
          </View>
        ) : (
          games.map((g) => {
            const isUserWhite = currentUserId ? g.whitePlayerId === currentUserId : true;
            const opponent = isUserWhite ? g.blackPlayer : g.whitePlayer;
            const opponentName =
              g.gameType === 'PLAYER_VS_AI'
                ? 'AI'
                : opponent?.name || 'Opponent';

            const isCancelled =
              g.status === 'CANCELLED' ||
              (g.status as string) === 'ABORTED' ||
              (g.result as any) === 'ABORTED';
            const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
            const isWinner = Boolean(winnerId && currentUserId && winnerId === currentUserId);
            const isLoser = Boolean(winnerId && currentUserId && winnerId !== currentUserId);
            const isDraw = !isCancelled && (g.result === 'DRAW' || g.result === 'STALEMATE') && !winnerId;
            const isActive = g.status === 'ACTIVE';

            const outcomeText = isActive
              ? 'In Progress'
              : isCancelled
              ? 'Cancelled'
              : isWinner
              ? 'Win'
              : isLoser
              ? 'Loss'
              : isDraw
              ? 'Draw'
              : 'Completed';

            const outcomeStyle = isActive
              ? styles.pillActive
              : isWinner
              ? styles.pillWin
              : isLoser
              ? styles.pillLoss
              : styles.pillDraw;

            const dateStr = new Date(g.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
            });

            const aiSuggestion = isLoser ? getAiCoachSuggestion(g, isUserWhite) : null;

            return (
              <TouchableOpacity
                key={g.id}
                style={[
                  styles.matchCard,
                  isWinner && styles.matchCardWinner,
                  isLoser && styles.matchCardLoser,
                ]}
                activeOpacity={0.8}
                onPress={() => handleGamePress(g)}
              >
                <View style={styles.matchCardHeader}>
                  <View style={styles.matchLeft}>
                    <View style={styles.avatarMini}>
                      <Text style={styles.avatarSym}>
                        {g.gameType === 'PLAYER_VS_AI' ? '🤖' : '⚔️'}
                      </Text>
                    </View>
                    <View style={styles.matchMeta}>
                      <Text style={styles.opponentName} numberOfLines={1}>
                        vs. {opponentName}
                      </Text>
                      <Text style={styles.matchDetails}>
                        Match #{g.id} • {g.timeControl} • {isUserWhite ? 'White' : 'Black'} • {dateStr}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.matchRight}>
                    <View style={[styles.outcomePill, outcomeStyle]}>
                      <Text style={styles.outcomePillText}>
                        {isWinner ? '🏆 Win' : outcomeText}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </View>
                </View>

                {/* WINNER: TROPHY & VICTORY BANNER */}
                {isWinner && (
                  <View style={styles.trophyBanner}>
                    <Text style={styles.trophyEmoji}>🏆</Text>
                    <View style={styles.trophyTextBox}>
                      <Text style={styles.trophyTitle}>Match #{g.id} Winner!</Text>
                      <Text style={styles.trophySub}>
                        Victory by {g.result ? g.result.toLowerCase() : 'checkmate'}. Outstanding tactical play!
                      </Text>
                    </View>
                  </View>
                )}

                {/* LOSER: AI COACH SUGGESTION */}
                {isLoser && aiSuggestion && (
                  <View style={styles.aiSuggestionBox}>
                    <View style={styles.aiSuggestionHeader}>
                      <Text style={styles.aiSuggestionIcon}>💡 🤖</Text>
                      <Text style={styles.aiSuggestionTitle}>AI Coach Suggestion:</Text>
                    </View>
                    <Text style={styles.aiSuggestionText}>{aiSuggestion}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      {/* Persistent Bottom Footer */}
      <AppFooter activeTab="account" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 26,
    color: '#202D29',
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202D29',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#74817A',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  startBtn: {
    backgroundColor: '#194E40',
    paddingHorizontal: 24,
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  startBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  matchCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    marginBottom: 12,
    ...SHADOWS.soft,
  },
  matchCardWinner: {
    borderColor: '#D5DFC8',
    backgroundColor: '#FFFFFF',
  },
  matchCardLoser: {
    borderColor: '#E4E9E1',
  },
  matchCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatarMini: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarSym: {
    fontSize: 18,
  },
  matchMeta: {
    flex: 1,
  },
  opponentName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 2,
  },
  matchDetails: {
    fontSize: 12,
    color: '#74817A',
  },
  matchRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outcomePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pillWin: {
    backgroundColor: COLORS.primary,
  },
  pillLoss: {
    backgroundColor: '#C53030',
  },
  pillDraw: {
    backgroundColor: '#74817A',
  },
  pillActive: {
    backgroundColor: '#D6EF9E',
  },
  outcomePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chevron: {
    fontSize: 20,
    color: '#74817A',
  },
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.hero,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    gap: 10,
  },
  trophyEmoji: {
    fontSize: 26,
  },
  trophyTextBox: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#194E40',
    marginBottom: 2,
  },
  trophySub: {
    fontSize: 11,
    color: '#74817A',
    lineHeight: 15,
  },
  aiSuggestionBox: {
    backgroundColor: COLORS.hero,
    borderRadius: 12,
    padding: 10,
    marginTop: 10,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  aiSuggestionIcon: {
    fontSize: 14,
  },
  aiSuggestionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#194E40',
  },
  aiSuggestionText: {
    fontSize: 12,
    color: '#202D29',
    lineHeight: 17,
  },
});
