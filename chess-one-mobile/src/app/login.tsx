import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Image,
  TouchableOpacity,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useGoogleAuth } from '../hooks/useGoogleAuth';
import { useAuthStore } from '../store/authStore';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { gameService } from '../services/game.service';
import { Game } from '../types/game.types';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
import { Feather } from '@expo/vector-icons';

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
      ? '👑 King Safety: Remember to castle early and avoid leaving your f2/g2 pawns vulnerable to quick queen attacks.'
      : '👑 King Safety: Watch out for back-rank threats and coordinate your rooks to maintain king defense.';
  }
  if (game.result === 'DRAW' || game.result === 'STALEMATE') {
    return '🤝 Solid Defense: Great tenacity fighting back to secure a draw in an equal endgame!';
  }
  return '🧠 Tactical Vision: Scan the board for undefended pieces before every move to prevent unexpected tactics.';
};

export default function LoginScreen() {
  const router = useRouter();
  const {
    signInWithGoogle,
    signOut,
    isLoading: isAuthLoading,
    error,
    redirectUri,
  } = useGoogleAuth();
  const { isAuthenticated, user, chessOneToken } = useAuthStore();

  const [games, setGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<'all' | 'wins' | 'losses'>('all');
  const [historyExpanded, setHistoryExpanded] = useState(true);
  const [showAllHistory, setShowAllHistory] = useState(false);

  const currentUserId = user?.id ? parseInt(String(user.id), 10) : null;

  // Fetch games for the authenticated user
  const fetchGames = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingGames(true);
      const res = await gameService.getMyGames();
      setGames(res.games || []);
    } catch (err) {
      console.warn('Failed to load user games in profile:', err);
    } finally {
      setIsLoadingGames(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  // Compute player stats
  const {
    totalGames,
    winCount,
    lossCount,
    drawCount,
    winRate,
    rating,
    filteredGames,
  } = useMemo(() => {
    const completed = games.filter(
      (g) => g.status === 'COMPLETED' || Boolean(g.result)
    );

    const wins = completed.filter(
      (g) => g.winnerId && currentUserId && g.winnerId === currentUserId
    );
    const losses = completed.filter(
      (g) => g.winnerId && currentUserId && g.winnerId !== currentUserId
    );
    const draws = completed.filter(
      (g) =>
        g.result === 'DRAW' ||
        g.result === 'STALEMATE' ||
        (!g.winnerId && g.result)
    );

    const total = completed.length;
    const winsNum = wins.length;
    const lossesNum = losses.length;
    const drawsNum = draws.length;

    const rate = total > 0 ? Math.round((winsNum / total) * 100) : 0;
    // Standard chess rating calculation starting at 1200
    const calculatedRating = Math.max(
      800,
      1200 + winsNum * 25 - lossesNum * 20 + drawsNum * 5
    );

    let displayList = games;
    if (historyFilter === 'wins') {
      displayList = games.filter(
        (g) => g.winnerId && currentUserId && g.winnerId === currentUserId
      );
    } else if (historyFilter === 'losses') {
      displayList = games.filter(
        (g) => g.winnerId && currentUserId && g.winnerId !== currentUserId
      );
    }

    return {
      totalGames: total,
      winCount: winsNum,
      lossCount: lossesNum,
      drawCount: drawsNum,
      winRate: rate,
      rating: calculatedRating,
      filteredGames: displayList,
    };
  }, [games, currentUserId, historyFilter]);

  const handleGoogleSignIn = async () => {
    const res = await signInWithGoogle();
    if (res?.success) {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const done = await AsyncStorage.getItem('@chessone_onboardingDone');
        if (!done) {
          router.replace('/onboarding' as any);
          return;
        }
      } catch (e) {}
      router.replace('/' as any);
    }
  };

  const handleGamePress = (game: Game) => {
    if (game.status === 'COMPLETED' || Boolean(game.result)) {
      router.push(`/game/result/${game.id}` as any);
    } else {
      router.push(`/game/${game.id}` as any);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Consistent Header */}
      <AppHeader
        title={isAuthenticated ? 'Career Records' : 'Sign In'}
        subtitle={isAuthenticated ? 'Match Insights & Stats' : 'Join ChessOne'}
        showBack={true}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isLoadingGames}
              onRefresh={fetchGames}
              tintColor={COLORS.primary}
            />
          ) : undefined
        }
      >
        {isAuthenticated && user ? (
          /* ======================================================== */
          /* AUTHENTICATED PROFILE & MATCH HISTORY VIEW               */
          /* ======================================================== */
          <View style={styles.authenticatedWrapper}>
            {/* 1. Profile Header Card */}
            <View style={styles.profileHeaderCard}>
              <View style={styles.avatarRow}>
                {user.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarInitial}>
                      {(user.name || user.email || 'P')[0].toUpperCase()}
                    </Text>
                    <View style={styles.avatarOnlineDot} />
                  </View>
                )}

                <View style={styles.profileTextCol}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.name || 'Chess Player'}
                  </Text>
                  <Text style={styles.userEmail} numberOfLines={1}>
                    {user.email}
                  </Text>
                  <View style={styles.idChip}>
                    <Text style={styles.idChipText}>Player ID: #{user.id}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>
                  {chessOneToken ? 'Connected & Ready to Play' : 'Signed In'}
                </Text>
              </View>
            </View>

            {/* 2. Player Career Stats Grid */}
            <View style={styles.statsContainer}>
              <View style={styles.statsHeaderRow}>
                <Text style={styles.statsHeaderTitle}>📊 Player Statistics</Text>
                <Text style={styles.statsHeaderSub}>Live Ratings & Metrics</Text>
              </View>

              <View style={styles.statsGrid}>
                {/* Rating Card */}
                <View style={[styles.statCard, styles.statCardRating]}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#D5E6C7' }]}>
                    <Text style={styles.statIcon}>⚡</Text>
                  </View>
                  <Text style={[styles.statValue, { color: COLORS.primary }]}>{rating}</Text>
                  <Text style={styles.statLabel}>Skill Rating</Text>
                  <Text style={styles.statSub}>Rapid & Blitz</Text>
                </View>

                {/* Total Games Played */}
                <View style={[styles.statCard, styles.statCardGames]}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#F0D4C5' }]}>
                    <Text style={styles.statIcon}>🎮</Text>
                  </View>
                  <Text style={[styles.statValue, { color: '#9A3412' }]}>{totalGames}</Text>
                  <Text style={styles.statLabel}>Total Games</Text>
                  <Text style={styles.statSub}>Played</Text>
                </View>

                {/* Total Wins */}
                <View style={[styles.statCard, styles.statCardWins]}>
                  <View style={[styles.statIconBadge, { backgroundColor: '#EAD7A8' }]}>
                    <Text style={styles.statIcon}>🏆</Text>
                  </View>
                  <Text style={[styles.statValue, { color: '#854D0E' }]}>{winCount}</Text>
                  <Text style={styles.statLabel}>Victories</Text>
                  <Text style={styles.statSub}>{winRate}% Win Rate</Text>
                </View>
              </View>

              {/* Record Summary Pills */}
              <View style={styles.recordPillRow}>
                <View style={[styles.recordPill, styles.recordPillWin]}>
                  <Text style={[styles.recordPillText, styles.recordPillWinText]}>
                    🏆 <Text style={styles.boldText}>{winCount}</Text> Wins
                  </Text>
                </View>
                <View style={[styles.recordPill, styles.recordPillLoss]}>
                  <Text style={[styles.recordPillText, styles.recordPillLossText]}>
                    ❌ <Text style={styles.boldText}>{lossCount}</Text> Losses
                  </Text>
                </View>
                <View style={[styles.recordPill, styles.recordPillDraw]}>
                  <Text style={[styles.recordPillText, styles.recordPillDrawText]}>
                    🤝 <Text style={styles.boldText}>{drawCount}</Text> Draws
                  </Text>
                </View>
              </View>
            </View>

            {/* 3. Match History Section with Trophies & AI Tips */}
            <View style={styles.historySection}>
              <View style={styles.historyHeaderRow}>
                <View style={styles.historyTitleRow}>
                  <Text style={styles.historyTitle}>📜 Match History</Text>
                  <View style={styles.historyCountBadge}>
                    <Text style={styles.historyCountText}>{games.length}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.toggleHistoryBtn}
                  activeOpacity={0.7}
                  onPress={() => setHistoryExpanded((prev) => !prev)}
                >
                  <Text style={styles.toggleHistoryText}>
                    {historyExpanded ? 'Collapse ▲' : 'Show Matches ▼'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Filter Pills */}
              {historyExpanded && (
                <View style={styles.filterPillsRow}>
                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      historyFilter === 'all' && styles.filterPillActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setHistoryFilter('all');
                      setShowAllHistory(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        historyFilter === 'all' && styles.filterPillTextActive,
                      ]}
                    >
                      All ({games.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      historyFilter === 'wins' && styles.filterPillActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setHistoryFilter('wins');
                      setShowAllHistory(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        historyFilter === 'wins' && styles.filterPillTextActive,
                      ]}
                    >
                      🏆 Wins ({winCount})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.filterPill,
                      historyFilter === 'losses' && styles.filterPillActive,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      setHistoryFilter('losses');
                      setShowAllHistory(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        historyFilter === 'losses' && styles.filterPillTextActive,
                      ]}
                    >
                      ❌ Losses ({lossCount})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Match Cards List */}
              {historyExpanded && (
                <View style={styles.historyList}>
                  {isLoadingGames && games.length === 0 ? (
                    <View style={styles.historyLoadingBox}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.historyLoadingText}>Loading matches...</Text>
                    </View>
                  ) : filteredGames.length === 0 ? (
                    <View style={styles.historyEmptyBox}>
                      <Text style={styles.historyEmptyIcon}>♟️</Text>
                      <Text style={styles.historyEmptyText}>
                        {historyFilter === 'wins'
                          ? 'No won matches yet. Play and claim your first trophy!'
                          : historyFilter === 'losses'
                          ? 'No lost matches recorded!'
                          : 'No matches played yet. Start a match to see records here.'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {(showAllHistory ? filteredGames : filteredGames.slice(0, 2)).map((g) => {
                        const isUserWhite = currentUserId
                          ? g.whitePlayerId === currentUserId
                          : true;
                        const opponent = isUserWhite ? g.blackPlayer : g.whitePlayer;
                        const opponentName =
                          g.gameType === 'PLAYER_VS_AI'
                            ? `Stockfish AI (${g.aiDifficulty || 'Medium'})`
                            : opponent?.name || 'Opponent';

                        const isWinner =
                          Boolean(g.winnerId && currentUserId && g.winnerId === currentUserId);
                        const isLoser =
                          Boolean(g.winnerId && currentUserId && g.winnerId !== currentUserId);
                        const isActive = g.status === 'ACTIVE';

                        const dateStr = g.createdAt
                          ? new Date(g.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })
                          : '';

                        const aiSuggestion = isLoser
                          ? getAiCoachSuggestion(g, isUserWhite)
                          : null;

                        return (
                          <TouchableOpacity
                            key={`match-${g.id}`}
                            style={[
                              styles.matchCard,
                              isWinner && styles.matchCardWinner,
                              isLoser && styles.matchCardLoser,
                            ]}
                            activeOpacity={0.8}
                            onPress={() => handleGamePress(g)}
                          >
                            {/* Match Header */}
                            <View style={styles.matchCardHeader}>
                              <View style={styles.matchOpponentRow}>
                                <View style={styles.matchModeIconBox}>
                                  <Text style={styles.matchModeIcon}>
                                    {g.gameType === 'PLAYER_VS_AI' ? '🤖' : '⚔️'}
                                  </Text>
                                </View>
                                <View style={styles.matchOpponentTextCol}>
                                  <Text style={styles.matchOpponentName} numberOfLines={1}>
                                    vs. {opponentName}
                                  </Text>
                                  <Text style={styles.matchMetaText}>
                                    Match #{g.id} • {g.timeControl} • {isUserWhite ? 'White' : 'Black'} • {dateStr}
                                  </Text>
                                </View>
                              </View>

                              {/* Result Badge */}
                              <View
                                style={[
                                  styles.outcomeBadge,
                                  isActive
                                    ? styles.badgeActive
                                    : isWinner
                                    ? styles.badgeWin
                                    : isLoser
                                    ? styles.badgeLoss
                                    : styles.badgeDraw,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.outcomeBadgeText,
                                    isActive
                                      ? styles.badgeActiveText
                                      : isWinner
                                      ? styles.badgeWinText
                                      : isLoser
                                      ? styles.badgeLossText
                                      : styles.badgeDrawText,
                                  ]}
                                >
                                  {isActive
                                    ? 'In Progress'
                                    : isWinner
                                    ? '🏆 Win'
                                    : isLoser
                                    ? 'Loss'
                                    : 'Draw'}
                                </Text>
                              </View>
                            </View>

                            {/* WINNER: TROPHY & VICTORY BANNER */}
                            {isWinner && (
                              <View style={styles.trophyBanner}>
                                <Text style={styles.trophyEmoji}>🏆</Text>
                                <View style={styles.trophyTextBox}>
                                  <Text style={styles.trophyTitle}>
                                    Match #{g.id} Victory!
                                  </Text>
                                  <Text style={styles.trophySub}>
                                    Won by {g.result ? g.result.toLowerCase() : 'checkmate'}. Excellent tactical play!
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* LOSER: AI COACH SUGGESTION MESSAGE */}
                            {isLoser && aiSuggestion && (
                              <View style={styles.aiSuggestionBox}>
                                <View style={styles.aiSuggestionHeader}>
                                  <Text style={styles.aiSuggestionIcon}>💡 🤖</Text>
                                  <Text style={styles.aiSuggestionTitle}>
                                    AI Coach Suggestion:
                                  </Text>
                                </View>
                                <Text style={styles.aiSuggestionText}>
                                  {aiSuggestion}
                                </Text>
                              </View>
                            )}

                            {/* Tap for analysis hint */}
                            <View style={styles.viewDetailsRow}>
                              <Text style={styles.viewDetailsText}>
                                View Match Result & Move Review ›
                              </Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}

                      {/* See More / Show Less Button */}
                      {filteredGames.length > 2 && (
                        <TouchableOpacity
                          style={styles.seeMoreBtn}
                          activeOpacity={0.8}
                          onPress={() => setShowAllHistory((prev) => !prev)}
                        >
                          <Text style={styles.seeMoreBtnText}>
                            {showAllHistory
                              ? 'Show Less (2 Recent) ▲'
                              : `See More Matches (${filteredGames.length - 2} more) ▼`}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </>
                  )}
                </View>
              )}
            </View>

            {/* 4. Navigation & Sign Out Buttons */}
            <View style={styles.profileActionsContainer}>
              <TouchableOpacity
                style={styles.enterHubButton}
                activeOpacity={0.85}
                onPress={() => router.push('/play/create' as any)}
              >
                <Text style={styles.enterHubButtonText}>⚔️ Start a Match ›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.signOutButton}
                activeOpacity={0.7}
                onPress={signOut}
              >
                <Feather name="log-out" size={16} color="#DC2626" style={{ marginRight: 6 }} />
                <Text style={styles.signOutButtonText}>Sign Out / Switch Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* ======================================================== */
          /* SIGN-IN PROMPT VIEW (WHEN LOGGED OUT)                    */
          /* ======================================================== */
          <View style={styles.card}>
            <View style={styles.authSection}>
              <View style={styles.loggedOutIconBox}>
                <Text style={{ fontSize: 36 }}>♟️</Text>
              </View>

              <Text style={styles.cardTitle}>Sign in to ChessOne</Text>
              <Text style={styles.cardSubtitle}>
                Sign in to view your career stats, skill rating, and match history with AI game reviews.
              </Text>

              {error ? (
                <View style={styles.errorBanner}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <View style={styles.errorTextContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                    {Platform.OS === 'web' && redirectUri ? (
                      <View style={styles.redirectHintBox}>
                        <Text style={styles.redirectHintTitle}>
                          Google Cloud Web Setup Note:
                        </Text>
                        <Text style={styles.redirectHintText}>
                          Add this exact URI to Authorized redirect URIs in Google Cloud Console:
                        </Text>
                        <Text selectable style={styles.redirectHintCode}>
                          {redirectUri}
                        </Text>
                        <TouchableOpacity
                          style={styles.openConsoleButton}
                          activeOpacity={0.8}
                          onPress={() =>
                            Linking.openURL(
                              'https://console.cloud.google.com/apis/credentials'
                            )
                          }
                        >
                          <Text style={styles.openConsoleButtonText}>
                            Open Google Cloud Console ↗
                          </Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {/* Google OAuth Button */}
              <GoogleSignInButton
                onPress={handleGoogleSignIn}
                isLoading={isAuthLoading}
                disabled={isAuthLoading}
                style={styles.googleButton}
              />

              <Text style={styles.disclaimerText}>
                By signing in, you agree to fair-play chess rules and terms of service.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Footer */}
      {isAuthenticated && <AppFooter activeTab="play" />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },

  /* Authenticated Profile Styles */
  authenticatedWrapper: {
    width: '100%',
    maxWidth: 650,
    gap: 16,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  avatarPlaceholder: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 2,
    borderColor: COLORS.white,
    ...SHADOWS.soft,
  },
  avatarInitial: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.white,
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  profileTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: 8,
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.hero,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: SIZES.radiusChip,
    borderWidth: 1,
    borderColor: '#C6DCB8',
  },
  idChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginTop: 14,
    gap: 8,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },

  /* Player Career Stats Grid */
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  statsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  statsHeaderTitle: {
    fontSize: 17,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  statsHeaderSub: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardRating: {
    backgroundColor: COLORS.hero,
    borderColor: '#C6DCB8',
  },
  statCardGames: {
    backgroundColor: COLORS.softPeach,
    borderColor: '#EED0C0',
  },
  statCardWins: {
    backgroundColor: COLORS.warmCream,
    borderColor: '#E5D3A2',
  },
  statIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statIcon: {
    fontSize: 16,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginTop: 3,
    textAlign: 'center',
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
    textAlign: 'center',
  },
  recordPillRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  recordPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  recordPillWin: {
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
  },
  recordPillWinText: {
    color: '#15803D',
  },
  recordPillLoss: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FCA5A5',
  },
  recordPillLossText: {
    color: '#B91C1C',
  },
  recordPillDraw: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
  },
  recordPillDrawText: {
    color: '#B45309',
  },
  recordPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  boldText: {
    fontWeight: '800',
  },

  /* Match History Section */
  historySection: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 17,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  historyCountBadge: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#C6DCB8',
  },
  historyCountText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleHistoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  toggleHistoryText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  filterPillTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  historyList: {
    gap: 10,
  },
  historyLoadingBox: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  historyLoadingText: {
    fontSize: 12.5,
    color: COLORS.textBody,
  },
  historyEmptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 8,
  },
  historyEmptyIcon: {
    fontSize: 34,
  },
  historyEmptyText: {
    fontSize: 13,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  /* Match Card */
  matchCard: {
    backgroundColor: '#FAFAF7',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  matchCardWinner: {
    borderColor: '#FDE047',
    backgroundColor: '#FEFCE8',
  },
  matchCardLoser: {
    borderColor: COLORS.border,
  },
  matchCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  matchOpponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  matchModeIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchModeIcon: {
    fontSize: 18,
  },
  matchOpponentTextCol: {
    flex: 1,
  },
  matchOpponentName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  matchMetaText: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
  },
  outcomeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: '#E0E7FF',
  },
  badgeActiveText: {
    color: '#3730A3',
  },
  badgeWin: {
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  badgeWinText: {
    color: '#15803D',
  },
  badgeLoss: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  badgeLossText: {
    color: '#B91C1C',
  },
  badgeDraw: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  badgeDrawText: {
    color: '#92400E',
  },
  outcomeBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },

  /* Trophy Banner for Wins */
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderWidth: 1,
    borderColor: '#FDE047',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 10,
  },
  trophyEmoji: {
    fontSize: 22,
  },
  trophyTextBox: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#854D0E',
  },
  trophySub: {
    fontSize: 11,
    color: '#A16207',
    marginTop: 1,
  },

  /* AI Suggestion Box for Losses */
  aiSuggestionBox: {
    backgroundColor: COLORS.hero,
    borderWidth: 1,
    borderColor: '#C6DCB8',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  aiSuggestionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiSuggestionIcon: {
    fontSize: 13,
  },
  aiSuggestionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  aiSuggestionText: {
    fontSize: 11.5,
    color: COLORS.textHeading,
    lineHeight: 16,
  },
  viewDetailsRow: {
    marginTop: 10,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
  },
  seeMoreBtn: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radiusButton,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  seeMoreBtnText: {
    color: COLORS.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  /* Profile Actions */
  profileActionsContainer: {
    width: '100%',
    gap: 12,
    marginTop: 4,
  },
  enterHubButton: {
    width: '100%',
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusButton,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  enterHubButtonText: {
    color: COLORS.white,
    fontSize: 15.5,
    fontWeight: '700',
  },
  signOutButton: {
    width: '100%',
    height: 46,
    borderRadius: SIZES.radiusButton,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  signOutButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Logged-out Card */
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    alignItems: 'center',
  },
  authSection: {
    width: '100%',
    alignItems: 'center',
  },
  loggedOutIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 13.5,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  googleButton: {
    width: '100%',
    marginBottom: 16,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
  },
  errorIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12.5,
    fontWeight: '600',
  },
  redirectHintBox: {
    marginTop: 8,
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 8,
  },
  redirectHintTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  redirectHintText: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  redirectHintCode: {
    fontSize: 10,
    fontFamily: 'monospace',
    color: COLORS.primary,
    marginTop: 2,
  },
  openConsoleButton: {
    marginTop: 6,
    paddingVertical: 4,
  },
  openConsoleButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 15,
  },
});
