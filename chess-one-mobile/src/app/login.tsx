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

const logoBanner = require('../../assets/images/chessone-logo-transparent.png');
const logoIcon = require('../../assets/images/chessone-icon.png');

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
      (g) =>
        (g.status === 'COMPLETED' || Boolean(g.result)) &&
        g.status !== 'CANCELLED' &&
        (g.status as string) !== 'ABORTED' &&
        (g.result as any) !== 'ABORTED'
    );

    const wins = completed.filter((g) => {
      const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
      return Boolean(winnerId && currentUserId && winnerId === currentUserId);
    });
    const losses = completed.filter((g) => {
      const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
      return Boolean(winnerId && currentUserId && winnerId !== currentUserId);
    });
    const draws = completed.filter((g) => {
      const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
      return (g.result === 'DRAW' || g.result === 'STALEMATE') && !winnerId;
    });

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
      displayList = games.filter((g) => {
        const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
        return Boolean(winnerId && currentUserId && winnerId === currentUserId);
      });
    } else if (historyFilter === 'losses') {
      displayList = games.filter((g) => {
        const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
        return Boolean(winnerId && currentUserId && winnerId !== currentUserId);
      });
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
      router.replace('/play' as any);
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isLoadingGames}
              onRefresh={fetchGames}
              tintColor="#194E40"
            />
          ) : undefined
        }
      >
        {/* Brand Banner */}
        <View style={styles.brandContainer}>
          {isAuthenticated ? (
            <View style={styles.authBrandRow}>
              <Image
                source={logoIcon}
                style={styles.authBrandIcon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.appName}>Player Profile</Text>
                <Text style={styles.appTagline}>Career Records & Match Insights</Text>
              </View>
            </View>
          ) : (
            <View style={styles.loggedOutBrandCol}>
              <Image
                source={logoBanner}
                style={styles.loggedOutLogoBanner}
                resizeMode="contain"
              />
              <Text style={styles.appTagline}>Compete • Learn • Master</Text>
            </View>
          )}
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
                            ? 'AI'
                            : opponent?.name || 'Opponent';

                        const isCancelled =
                          g.status === 'CANCELLED' ||
                          (g.status as string) === 'ABORTED' ||
                          (g.result as any) === 'ABORTED';
                        const winnerId = g.winnerId ?? (g.winner?.id as any) ?? null;
                        const isWinner =
                          Boolean(winnerId && currentUserId && winnerId === currentUserId);
                        const isLoser =
                          Boolean(winnerId && currentUserId && winnerId !== currentUserId);
                        const isDraw =
                          !isCancelled &&
                          (g.result === 'DRAW' || g.result === 'STALEMATE') &&
                          !winnerId;
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
                                    : isCancelled
                                    ? styles.badgeDraw
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
                                    : isCancelled
                                    ? 'Cancelled'
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
    backgroundColor: '#F5F7F2',
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
    marginBottom: 20,
    width: '100%',
  },
  loggedOutBrandCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loggedOutLogoBanner: {
    width: 250,
    height: 92,
    marginBottom: 6,
  },
  authBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  authBrandIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  appName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202D29',
    letterSpacing: 0.3,
  },
  appTagline: {
    fontSize: 12,
    color: '#74817A',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  /* Authenticated Profile Styles */
  authenticatedWrapper: {
    width: '100%',
    maxWidth: 520,
    gap: 14,
  },
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    borderColor: '#194E40',
  },
  avatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EEF3E8',
    borderWidth: 2,
    borderColor: '#D5DFC8',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  avatarInitial: {
    fontSize: 26,
    fontWeight: '800',
    color: '#194E40',
  },
  avatarOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4F8A5B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileTextCol: {
    flex: 1,
  },
  userName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: '#74817A',
    marginBottom: 6,
  },
  idChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D5DFC8',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#194E40',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  statusDot: {
    fontSize: 9,
    color: '#4F8A5B',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#194E40',
  },

  /* Player Career Stats Grid */
  statsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statsHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202D29',
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
    backgroundColor: '#EEF3E8',
    borderColor: '#D5DFC8',
  },
  statCardGames: {
    backgroundColor: '#F5F7F2',
    borderColor: '#E4E9E1',
  },
  statCardWins: {
    backgroundColor: '#E5EDDA',
    borderColor: '#C8D9BE',
  },
  statIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202D29',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#202D29',
    marginTop: 2,
  },
  statSub: {
    fontSize: 10,
    color: '#74817A',
    marginTop: 2,
  },
  recordPillRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  recordPill: {
    flex: 1,
    backgroundColor: '#F5F7F2',
    borderRadius: 10,
    paddingVertical: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  recordPillText: {
    fontSize: 11,
    color: '#74817A',
  },
  boldText: {
    fontWeight: '800',
    color: '#202D29',
  },

  /* Match History Section */
  historySection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
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
    color: '#202D29',
  },
  historyCountBadge: {
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#D5DFC8',
  },
  historyCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#194E40',
  },
  toggleHistoryBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  toggleHistoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#194E40',
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
    backgroundColor: '#F5F7F2',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  filterPillActive: {
    backgroundColor: '#194E40',
    borderColor: '#194E40',
  },
  filterPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#74817A',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
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
    color: '#74817A',
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
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  /* Match Card */
  matchCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  matchCardWinner: {
    borderColor: '#C8D9BE',
    backgroundColor: '#E5EDDA',
  },
  matchCardLoser: {
    borderColor: '#E4E9E1',
    backgroundColor: '#FFFFFF',
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
    color: '#202D29',
    maxWidth: 170,
  },
  matchMetaText: {
    fontSize: 11,
    color: '#74817A',
    marginTop: 2,
  },
  outcomeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeActive: {
    backgroundColor: '#D6EF9E',
  },
  badgeWin: {
    backgroundColor: '#194E40',
  },
  badgeLoss: {
    backgroundColor: '#FCEDDF',
    borderWidth: 1,
    borderColor: '#F7A18C',
  },
  badgeDraw: {
    backgroundColor: '#E4E9E1',
  },
  outcomeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#202D29',
  },

  /* Trophy Banner for Wins */
  trophyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5EDDA',
    borderWidth: 1,
    borderColor: '#C8D9BE',
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
    color: '#194E40',
  },
  trophySub: {
    fontSize: 10.5,
    color: '#202D29',
    marginTop: 1,
  },

  /* AI Suggestion Box for Losses */
  aiSuggestionBox: {
    backgroundColor: '#EEF3E8',
    borderWidth: 1,
    borderColor: '#D5DFC8',
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
    color: '#194E40',
  },
  aiSuggestionText: {
    fontSize: 11.5,
    color: '#202D29',
    lineHeight: 16,
  },
  viewDetailsRow: {
    marginTop: 8,
    alignItems: 'flex-end',
  },
  viewDetailsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#194E40',
  },
  seeMoreBtn: {
    backgroundColor: '#EEF3E8',
    borderWidth: 1,
    borderColor: '#D5DFC8',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  seeMoreBtnText: {
    color: '#194E40',
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
    backgroundColor: '#194E40',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  enterHubButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  signOutButton: {
    width: '100%',
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  signOutButtonText: {
    color: '#C53030',
    fontSize: 13.5,
    fontWeight: '600',
  },

  /* Signed-Out Auth Section */
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  authSection: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  errorBanner: {
    flexDirection: 'row',
    backgroundColor: '#FCEDDF',
    borderWidth: 1,
    borderColor: '#F7A18C',
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
    color: '#C53030',
    lineHeight: 18,
  },
  redirectHintBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F7C2B3',
  },
  redirectHintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#C53030',
    marginBottom: 4,
  },
  redirectHintText: {
    fontSize: 11,
    color: '#C53030',
    lineHeight: 16,
    marginBottom: 6,
  },
  redirectHintCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#194E40',
    backgroundColor: '#EEF3E8',
    padding: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D5DFC8',
    marginBottom: 8,
  },
  openConsoleButton: {
    paddingVertical: 6,
    alignItems: 'center',
  },
  openConsoleButtonText: {
    fontSize: 12,
    color: '#194E40',
    fontWeight: '700',
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
    backgroundColor: '#E4E9E1',
  },
  dividerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#74817A',
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
    backgroundColor: '#EEF3E8',
    borderColor: '#D5DFC8',
  },
  player2Btn: {
    backgroundColor: '#E5EDDA',
    borderColor: '#C8D9BE',
  },
  devSignInButtonText: {
    color: '#202D29',
    fontSize: 14,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 11,
    color: '#74817A',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 16,
  },
});
