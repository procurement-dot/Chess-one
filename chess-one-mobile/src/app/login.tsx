import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
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
import { AppFooter } from '../components/navigation/AppFooter';
import { gameService } from '../services/game.service';
import { Game } from '../types/game.types';

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
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isLoadingGames}
              onRefresh={fetchGames}
              tintColor="#38BDF8"
            />
          ) : undefined
        }
      >
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          
          <Image source={require('../../assets/images/chessone-logo.png')} style={{ width: 180, height: 60, resizeMode: 'contain', marginBottom: 12 }} />
          <Text style={styles.appTagline}>
            {isAuthenticated ? 'Career Records & Match Insights' : 'Compete • Learn • Master'}
          </Text>
        </View>

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
                      {(user.name || user.email || 'U')[0].toUpperCase()}
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
                <Text style={styles.statusDot}>●</Text>
                <Text style={styles.statusText}>
                  {chessOneToken ? 'Connected & Ready to Play' : 'Signed In'}
                </Text>
              </View>
            </View>

            {/* 2. Player Career Stats Grid */}
            <View style={styles.statsContainer}>
              <Text style={styles.statsHeaderTitle}>📊 Player Statistics</Text>

              <View style={styles.statsGrid}>
                {/* Rating Card */}
                <View style={[styles.statCard, styles.statCardRating]}>
                  <Text style={styles.statIcon}>⚡</Text>
                  <Text style={styles.statValue}>{rating}</Text>
                  <Text style={styles.statLabel}>Skill Rating</Text>
                  <Text style={styles.statSub}>Rapid & Blitz</Text>
                </View>

                {/* Total Games Played */}
                <View style={[styles.statCard, styles.statCardGames]}>
                  <Text style={styles.statIcon}>🎮</Text>
                  <Text style={styles.statValue}>{totalGames}</Text>
                  <Text style={styles.statLabel}>Total Games</Text>
                  <Text style={styles.statSub}>Played</Text>
                </View>

                {/* Total Wins */}
                <View style={[styles.statCard, styles.statCardWins]}>
                  <Text style={styles.statIcon}>🏆</Text>
                  <Text style={styles.statValue}>{winCount}</Text>
                  <Text style={styles.statLabel}>Victories</Text>
                  <Text style={styles.statSub}>{winRate}% Win Rate</Text>
                </View>
              </View>

              {/* Record Summary Pill */}
              <View style={styles.recordPillRow}>
                <View style={styles.recordPill}>
                  <Text style={styles.recordPillText}>
                    🏆 <Text style={styles.boldText}>{winCount}</Text> Wins
                  </Text>
                </View>
                <View style={styles.recordPill}>
                  <Text style={styles.recordPillText}>
                    ❌ <Text style={styles.boldText}>{lossCount}</Text> Losses
                  </Text>
                </View>
                <View style={styles.recordPill}>
                  <Text style={styles.recordPillText}>
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
                      <ActivityIndicator size="small" color="#38BDF8" />
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
                        const isDraw =
                          g.result === 'DRAW' ||
                          g.result === 'STALEMATE' ||
                          (!g.winnerId && g.result);
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
                                <Text style={styles.matchModeIcon}>
                                  {g.gameType === 'PLAYER_VS_AI' ? '🤖' : '⚔️'}
                                </Text>
                                <View>
                                  <Text style={styles.matchOpponentName} numberOfLines={1}>
                                    vs. {opponentName}
                                  </Text>
                                  <Text style={styles.matchMetaText}>
                                    Match #{g.id} • {g.timeControl} • {isUserWhite ? 'White' : 'Black'} • {dateStr}
                                  </Text>
                                </View>
                              </View>

                              {/* Result Pill */}
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
                                <Text style={styles.outcomeBadgeText}>
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
                                    Match #{g.id} Winner!
                                  </Text>
                                  <Text style={styles.trophySub}>
                                    Victory by {g.result ? g.result.toLowerCase() : 'checkmate'}. Excellent tactical execution!
                                  </Text>
                                </View>
                              </View>
                            )}

                            {/* LOSER: SMALL AI COACH SUGGESTION MESSAGE */}
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
      {isAuthenticated && <AppFooter activeTab="account" />}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
    alignItems: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.border,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  logoIcon: {
    fontSize: 30,
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: 0.5,
  },
  appTagline: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 2,
    letterSpacing: 0.8,
  },

  /* Authenticated Profile Styles */
  authenticatedWrapper: {
    width: '100%',
    maxWidth: 520,
    gap: 14,
  },
  profileHeaderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#38BDF8',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.border,
    borderWidth: 2,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#38BDF8',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
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
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: 6,
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    fontSize: 9,
    color: '#34D399',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D1FAE5',
  },

  /* Player Career Stats Grid */
  statsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  statCardRating: {
    backgroundColor: '#172554',
    borderColor: '#2563EB',
  },
  statCardGames: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1',
  },
  statCardWins: {
    backgroundColor: '#143823',
    borderColor: '#059669',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#CBD5E1',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  recordPillRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  recordPill: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  recordPillText: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  boldText: {
    fontWeight: '800',
    color: COLORS.textHeading,
  },

  /* Match History Section */
  historySection: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  historyCountBadge: {
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#38BDF8',
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },
  toggleHistoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleHistoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
  },
  filterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterPillActive: {
    backgroundColor: '#2563EB',
    borderColor: '#38BDF8',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  filterPillTextActive: {
    color: COLORS.textHeading,
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
    fontSize: 12,
    color: COLORS.textBody,
  },
  historyEmptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 6,
  },
  historyEmptyIcon: {
    fontSize: 32,
  },
  historyEmptyText: {
    fontSize: 12.5,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  /* Match Card */
  matchCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#242C38',
  },
  matchCardWinner: {
    borderColor: '#D97706',
    backgroundColor: '#17140B',
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
  matchModeIcon: {
    fontSize: 20,
  },
  matchOpponentName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
    maxWidth: 170,
  },
  matchMetaText: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 2,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: '#1E3A8A',
  },
  badgeWin: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  badgeLoss: {
    backgroundColor: '#450A0A',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  badgeDraw: {
    backgroundColor: COLORS.border,
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },

  /* Trophy Banner for Wins */
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#261C02',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 10,
    padding: 8,
    marginTop: 10,
    gap: 10,
  },
  trophyEmoji: {
    fontSize: 24,
  },
  trophyTextBox: {
    flex: 1,
  },
  trophyTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FBBF24',
  },
  trophySub: {
    fontSize: 10.5,
    color: '#FDE68A',
    marginTop: 1,
  },

  /* AI Suggestion Box for Losses */
  aiSuggestionBox: {
    backgroundColor: COLORS.border,
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 10,
    padding: 9,
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
    fontSize: 11.5,
    fontWeight: '800',
    color: '#60A5FA',
  },
  aiSuggestionText: {
    fontSize: 11.5,
    color: '#E2E8F0',
    lineHeight: 16,
  },
  viewDetailsRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#38BDF8',
  },
  seeMoreBtn: {
    backgroundColor: '#1E2530',
    borderWidth: 1,
    borderColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  seeMoreBtnText: {
    color: '#60A5FA',
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  /* Profile Actions */
  profileActionsContainer: {
    width: '100%',
    gap: 10,
    marginTop: 4,
  },
  enterHubButton: {
    width: '100%',
    height: 48,
    backgroundColor: '#2563EB',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  enterHubButtonText: {
    color: COLORS.textHeading,
    fontSize: 15,
    fontWeight: '700',
  },
  signOutButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  signOutButtonText: {
    color: '#EF4444',
    fontSize: 13.5,
    fontWeight: '600',
  },

  /* Signed-Out Auth Section */
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  authSection: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#2D1B1F',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    width: '100%',
    gap: 8,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#FCA5A5',
    lineHeight: 18,
  },
  redirectHintBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#451A20',
  },
  redirectHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F87171',
    marginBottom: 4,
  },
  redirectHintText: {
    fontSize: 11,
    color: '#FCA5A5',
    lineHeight: 16,
    marginBottom: 6,
  },
  redirectHintCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#FEF08A',
    backgroundColor: '#18181B',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3F3F46',
    marginBottom: 8,
  },
  openConsoleButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  openConsoleButtonText: {
    fontSize: 12,
    color: '#60A5FA',
    fontWeight: '600',
  },
  googleButton: {
    width: '100%',
    marginBottom: 16,
  },
  devOptionsSection: {
    width: '100%',
    gap: 10,
    marginTop: 6,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textBody,
    letterSpacing: 1,
  },
  devSignInButton: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  player1Btn: {
    backgroundColor: '#1A2333',
    borderColor: '#2563EB',
  },
  player2Btn: {
    backgroundColor: '#1C2622',
    borderColor: '#059669',
  },
  devSignInButtonText: {
    color: COLORS.textHeading,
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    color: COLORS.textBody,
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
