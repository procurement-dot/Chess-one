import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { puzzleService } from '../../services/puzzle.service';
import { PuzzleItem } from '../../data/learn/puzzlesData';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useLearnStore, learnStore } from '../../features/learn/learnStore';
import { LEARN_LEVELS, WEEKLY_QUESTS, BADGES_DATA, CHESS_PUZZLES } from '../../data/learn';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CHIPS = ['Level journey', 'Tactics & Puzzles', 'Foundation', 'Developing', 'Advanced', 'Learn by game'];

export default function LearnScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState(CHIPS[0]);
  const { completedLevels, questProgress, collectedRewards, coachPracticed, gameReviewed, solvedPuzzles, totalXp, tacticalRating = 1000 } = useLearnStore();

  const [loadedPuzzles, setLoadedPuzzles] = useState<PuzzleItem[]>(CHESS_PUZZLES);
  const [puzzlesPage, setPuzzlesPage] = useState<number>(1);
  const [loadingMorePuzzles, setLoadingMorePuzzles] = useState<boolean>(false);
  const [puzzleSubTab, setPuzzleSubTab] = useState<'to_solve' | 'solved'>('to_solve');
  const [isStatsExpanded, setIsStatsExpanded] = useState<boolean>(false);
  const [selectedTacticsTier, setSelectedTacticsTier] = useState<string>('All');

  const toSolvePuzzles = useMemo(() => {
    return loadedPuzzles.filter((p) => !solvedPuzzles.includes(p.id));
  }, [loadedPuzzles, solvedPuzzles]);

  const solvedPuzzlesList = useMemo(() => {
    return loadedPuzzles.filter((p) => solvedPuzzles.includes(p.id));
  }, [loadedPuzzles, solvedPuzzles]);

  const adaptiveSkillTier = useMemo(() => {
    if (tacticalRating < 800) return '🌱 Foundation';
    if (tacticalRating < 1100) return '⚔️ Pre-Intermediate';
    if (tacticalRating < 1400) return '🛡️ Intermediate';
    if (tacticalRating < 1700) return '⚡ Pre-Advance';
    return '👑 Advance';
  }, [tacticalRating]);

  const handleTacticsTierSelect = async (tier: string) => {
    setSelectedTacticsTier(tier);
    try {
      setLoadingMorePuzzles(true);
      const params = tier === 'All' ? { limit: 15, page: 1 } : { tier: tier as any, limit: 15, page: 1 };
      const newPuzzles = await puzzleService.getPuzzles(params);
      if (newPuzzles && newPuzzles.length > 0) {
        setLoadedPuzzles(newPuzzles.map((p, idx) => ({ ...p, number: idx + 1 })));
        setPuzzlesPage(1);
      }
    } catch (e) {
      console.warn('Failed to filter puzzles:', e);
    } finally {
      setLoadingMorePuzzles(false);
    }
  };

  const handleLoadMorePuzzles = async () => {
    try {
      setLoadingMorePuzzles(true);
      const nextPage = puzzlesPage + 1;
      const params = selectedTacticsTier === 'All'
        ? { limit: 15, page: nextPage }
        : { tier: selectedTacticsTier as any, limit: 15, page: nextPage };
      const newPuzzles = await puzzleService.getPuzzles(params);
      if (newPuzzles && newPuzzles.length > 0) {
        setLoadedPuzzles((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const filtered = newPuzzles.filter((p) => !existingIds.has(p.id));
          return [
            ...prev,
            ...filtered.map((p, idx) => ({ ...p, number: prev.length + idx + 1 })),
          ];
        });
        setPuzzlesPage(nextPage);
      }
    } catch (e) {
      console.warn('Failed to load more puzzles from Supabase:', e);
    } finally {
      setLoadingMorePuzzles(false);
    }
  };

  // Compute total stars earned (from levels + solved tactics)
  const totalStars = useMemo(() => {
    const levelStars = Object.values(completedLevels).reduce((sum, s) => sum + (s || 0), 0);
    const puzzleStars = solvedPuzzles.reduce((sum, id) => {
      const puz = loadedPuzzles.find((p) => p.id === id);
      const rating = puz ? puz.rating : 1000;
      return sum + (rating >= 1500 ? 3 : rating >= 1000 ? 2 : 1);
    }, 0);
    return levelStars + puzzleStars;
  }, [completedLevels, solvedPuzzles, loadedPuzzles]);

  const completedCount = useMemo(() => {
    return Object.keys(completedLevels).length;
  }, [completedLevels]);

  const handleLevelPress = (id: number) => {
    const isUnlocked = id === 1 || !!completedLevels[id - 1];
    if (isUnlocked) {
      router.push(`/learn/level?id=${id}` as any);
    } else {
      const msg = `Please complete Level ${id - 1} to unlock this lesson.`;
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Level Locked', msg);
      }
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Learn" subtitle="Master the board" />

      {/* Collapsible Progress Banner */}
      <View style={styles.collapsibleStatsContainer}>
        <TouchableOpacity
          style={styles.statsToggleHeader}
          onPress={() => setIsStatsExpanded((prev) => !prev)}
          activeOpacity={0.7}
        >
          <View style={styles.statsToggleLeft}>
            <Text style={styles.statsToggleTitle}>📊 My Progress</Text>
            <View style={styles.miniStatBadge}>
              <Text style={styles.miniStatText}>⭐ {totalStars} Stars</Text>
            </View>
            <View style={[styles.miniStatBadge, { backgroundColor: '#F0F3EE', borderColor: '#E3E8DE' }]}>
              <Text style={[styles.miniStatText, { color: COLORS.textHeading }]}>🏆 {completedCount}/{LEARN_LEVELS.length}</Text>
            </View>
          </View>

          <View style={styles.statsToggleRight}>
            <Text style={styles.statsToggleAction}>
              {isStatsExpanded ? 'Hide' : 'Details'}
            </Text>
            <Feather
              name={isStatsExpanded ? 'chevron-up' : 'chevron-down'}
              size={14}
              color={COLORS.primary}
            />
          </View>
        </TouchableOpacity>

        {isStatsExpanded && (
          <View style={styles.statsExpandedContent}>
            {/* 4 Metrics Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statGridCard}>
                <Text style={styles.statCardIcon}>⭐</Text>
                <View>
                  <Text style={styles.statCardVal}>{totalStars}</Text>
                  <Text style={styles.statCardLabel}>Total Stars</Text>
                </View>
              </View>

              <View style={styles.statGridCard}>
                <Text style={styles.statCardIcon}>⚡</Text>
                <View>
                  <Text style={styles.statCardVal}>{totalXp}</Text>
                  <Text style={styles.statCardLabel}>Total XP</Text>
                </View>
              </View>

              <View style={styles.statGridCard}>
                <Text style={styles.statCardIcon}>🧩</Text>
                <View>
                  <Text style={styles.statCardVal}>{solvedPuzzles.length} / 32,241</Text>
                  <Text style={styles.statCardLabel}>Tactics Solved</Text>
                </View>
              </View>

              <View style={styles.statGridCard}>
                <Text style={styles.statCardIcon}>🏆</Text>
                <View>
                  <Text style={styles.statCardVal}>{completedCount} / {LEARN_LEVELS.length}</Text>
                  <Text style={styles.statCardLabel}>Levels Done</Text>
                </View>
              </View>
            </View>

            {/* Course Completion Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeaderRow}>
                <Text style={styles.progressLabel}>Curriculum Completion</Text>
                <Text style={styles.progressPct}>
                  {Math.round((completedCount / LEARN_LEVELS.length) * 100)}%
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${Math.min(100, Math.round((completedCount / LEARN_LEVELS.length) * 100))}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        )}
      </View>

      {/* Chips Navigation */}
      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[
                styles.chip,
                activeChip === chip && styles.activeChip,
                chip === 'Tactics & Puzzles' && activeChip !== chip && { borderColor: '#F59E0B', borderWidth: 1, backgroundColor: '#FEF3C7' },
              ]}
              onPress={() => setActiveChip(chip)}
            >
              <Text
                style={[
                  styles.chipText,
                  activeChip === chip && styles.activeChipText,
                  chip === 'Tactics & Puzzles' && activeChip !== chip && { color: '#92400E', fontWeight: '700' },
                ]}
              >
                {chip === 'Tactics & Puzzles' ? '🧩 ' + chip : chip}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ======================================================== */}
        {/* TAB 1: LEVEL JOURNEY                                     */}
        {/* ======================================================== */}
        {activeChip === 'Level journey' && (
          <View style={styles.tabContent}>
            
            {/* NEW: DAILY PUZZLE HIGHLIGHT CARD */}
            <TouchableOpacity
              style={styles.dailyPuzzleBanner}
              onPress={() => router.push('/learn/puzzle' as any)}
              activeOpacity={0.85}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.dailyPuzzleTag}>DAILY TACTIC</Text>
                  <Text style={styles.dailyPuzzleSolvedTag}>
                    {solvedPuzzles.length > 0 ? `${solvedPuzzles.length} Solved ✓` : '10 Available'}
                  </Text>
                </View>
                <Text style={styles.dailyPuzzleTitle}>White to move · Mate in 1</Text>
                <Text style={styles.dailyPuzzleSub}>Spot the winning Queen checkmate! · <Text style={{ fontWeight: '800', color: '#1E4B3A' }}>+30 XP</Text></Text>
              </View>

              <View style={styles.dailyPuzzleIconBox}>
                <Text style={{ fontSize: 24 }}>🧩</Text>
              </View>
            </TouchableOpacity>

            {/* Quick Action Cards: Coach Practice & Game Review */}
            <View style={styles.quickGrid}>
              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => router.push('/learn/practice' as any)}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#E4EEDB' }]}>
                  <Text style={{ fontSize: 20 }}>🤖</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Coach Practice</Text>
                  <Text style={styles.quickSub}>Live hints & dialogue ›</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickCard}
                onPress={() => router.push('/learn/gameReview' as any)}
              >
                <View style={[styles.quickIconBox, { backgroundColor: '#FAF7F0' }]}>
                  <Text style={{ fontSize: 20 }}>♟️</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.quickTitle}>Game Review</Text>
                  <Text style={styles.quickSub}>Italian opening ›</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* World 1 Banner */}
            <View style={styles.worldSelector}>
              <View>
                <Text style={styles.eyebrow}>WORLD 1 OF 3</Text>
                <Text style={styles.worldTitle}>Piece Explorers</Text>
                <Text style={styles.worldDesc}>Master the movement and power of every piece</Text>
              </View>
              <View style={styles.worldIconBox}>
                <Text style={styles.worldIconText}>🗺️</Text>
              </View>
            </View>

            {/* Zig-Zag Level Journey Nodes */}
            <View style={styles.whiteCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Level Pathway</Text>
                <Text style={styles.sectionBadge}>
                  Level {Math.min(completedCount + 1, LEARN_LEVELS.length)} Active
                </Text>
              </View>

              <View style={styles.journeyPath}>
                {LEARN_LEVELS.map((lvl, index) => {
                  const isCompleted = !!completedLevels[lvl.id];
                  const stars = completedLevels[lvl.id] || 0;
                  const isUnlocked = lvl.id === 1 || !!completedLevels[lvl.id - 1];
                  const isCurrent = isUnlocked && !isCompleted;
                  const isEven = index % 2 === 0;

                  return (
                    <View
                      key={lvl.id}
                      style={[
                        styles.levelNodeRow,
                        isEven ? { justifyContent: 'flex-start' } : { justifyContent: 'flex-end' },
                      ]}
                    >
                      <TouchableOpacity
                        style={[
                          styles.levelNodeCard,
                          isCompleted && styles.nodeCompleted,
                          isCurrent && styles.nodeCurrent,
                          !isUnlocked && styles.nodeLocked,
                        ]}
                        onPress={() => handleLevelPress(lvl.id)}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.levelCircle,
                            isCompleted ? styles.circleCompleted : isCurrent ? styles.circleCurrent : styles.circleLocked,
                          ]}
                        >
                          {isCompleted ? (
                            <Feather name="check" size={24} color={COLORS.white} />
                          ) : isUnlocked ? (
                            <Feather name="play" size={22} color={COLORS.white} />
                          ) : (
                            <Feather name="lock" size={20} color={COLORS.border} />
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={styles.levelTitleRow}>
                            <Text style={styles.levelPieceIcon}>{lvl.pieceSymbol}</Text>
                            <Text
                              style={[
                                styles.levelTitle,
                                isCurrent && { color: COLORS.primary, fontWeight: '800' },
                                !isUnlocked && { color: COLORS.textBody },
                              ]}
                            >
                              {lvl.id}. {lvl.title}
                            </Text>
                          </View>

                          {isCompleted && (
                            <View style={styles.starsRow}>
                              {[1, 2, 3].map((s) => (
                                <Feather
                                  key={s}
                                  name="star"
                                  size={13}
                                  color={s <= stars ? '#F59E0B' : '#E2E8F0'}
                                />
                              ))}
                              <Text style={styles.starsText}>+{lvl.xpReward} XP</Text>
                            </View>
                          )}

                          {isCurrent && (
                            <Text style={styles.playNowTag}>Tap to Play ›</Text>
                          )}

                          {!isUnlocked && (
                            <Text style={styles.lockedTag}>Locked</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Weekly Quests Section */}
            <View style={styles.whiteCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🎯 Weekly Quests</Text>
                <Text style={styles.sectionBadge}>
                  {collectedRewards.length} Claimed
                </Text>
              </View>

              {WEEKLY_QUESTS.map((quest) => {
                const isClaimed = collectedRewards.includes(quest.id);
                const currentVal =
                  quest.id === 'q1'
                    ? Math.min(completedCount, quest.target)
                    : quest.id === 'q2'
                    ? coachPracticed ? 1 : 0
                    : quest.id === 'q3'
                    ? gameReviewed ? 1 : 0
                    : Math.min(solvedPuzzles.length, quest.target);
                const isDone = currentVal >= quest.target;

                return (
                  <View key={quest.id} style={styles.questItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.questTitle}>{quest.title}</Text>
                      <Text style={styles.questSub}>{quest.subtitle}</Text>
                    </View>

                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text
                        style={[
                          styles.questProgressText,
                          isDone && { color: COLORS.progressFill, fontWeight: '800' },
                        ]}
                      >
                        {currentVal} / {quest.target} {isDone ? '✓' : ''}
                      </Text>

                      {isDone && !isClaimed && (
                        <TouchableOpacity
                          style={styles.rewardBtn}
                          onPress={() => learnStore.collectReward(quest.id, quest.xpReward)}
                        >
                          <Text style={styles.rewardBtnText}>Collect · {quest.xpReward} XP</Text>
                        </TouchableOpacity>
                      )}

                      {isClaimed && (
                        <View style={styles.claimedBadge}>
                          <Text style={styles.claimedBadgeText}>Claimed ✓</Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* Badge Shelf Section */}
            <View style={styles.whiteCard}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>🏆 Badge Shelf</Text>
                <Text style={styles.sectionBadge}>Achievements</Text>
              </View>

              <View style={styles.badgesGrid}>
                {BADGES_DATA.map((badge) => {
                  const isUnlocked = badge.checkUnlocked({
                    completedCount,
                    coachPracticed,
                    gameReviewed,
                    totalStars,
                    puzzlesSolvedCount: solvedPuzzles.length,
                  });

                  return (
                    <View
                      key={badge.id}
                      style={[
                        styles.badgeItem,
                        !isUnlocked && { opacity: 0.55 },
                      ]}
                    >
                      <View
                        style={[
                          styles.badgeCircle,
                          { backgroundColor: isUnlocked ? badge.bgColor : '#E2E8F0' },
                        ]}
                      >
                        <Feather
                          name={isUnlocked ? badge.icon : 'lock'}
                          size={20}
                          color={isUnlocked ? COLORS.white : COLORS.border}
                        />
                      </View>
                      <Text style={styles.badgeLabel} numberOfLines={1}>{badge.title}</Text>
                      <Text
                        style={[
                          styles.badgeStatus,
                          isUnlocked && { color: COLORS.progressFill, fontWeight: '700' },
                        ]}
                      >
                        {isUnlocked ? 'Unlocked' : 'Locked'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ======================================================== */}
        {/* TAB 2: TACTICS & PUZZLES (ADAPTIVE AI & 2 SEGMENT TABS)  */}
        {/* ======================================================== */}
        {activeChip === 'Tactics & Puzzles' && (
          <View style={styles.tabContent}>
            {/* Header with Adaptive Skill Badge */}
            <View style={styles.worldSelector}>
              <View style={{ flex: 1 }}>
                <Text style={styles.eyebrow}>TACTICS ARENA · 32,241 PUZZLES</Text>
                <Text style={styles.worldTitle}>Master Tactical Motifs</Text>
                <Text style={styles.worldDesc}>
                  Live from official 32k Lichess database · {adaptiveSkillTier} ({tacticalRating} ELO)
                </Text>
              </View>
              <TouchableOpacity
                style={styles.randomLaunchBtn}
                onPress={() => {
                  const pool = puzzleSubTab === 'to_solve' && toSolvePuzzles.length > 0 ? toSolvePuzzles : loadedPuzzles;
                  const randomPuz = pool[Math.floor(Math.random() * pool.length)] || CHESS_PUZZLES[0];
                  router.push(`/learn/puzzle?id=${randomPuz.id}` as any);
                }}
              >
                <Text style={styles.randomLaunchText}>Play 🎲</Text>
              </TouchableOpacity>
            </View>

            {/* Live Adaptive AI Skill Indicator Card */}
            <View style={styles.adaptiveCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>🧠</Text>
                  <Text style={styles.adaptiveCardTitle}>Adaptive AI Skill Rating</Text>
                </View>
                <View style={styles.adaptiveRatingPill}>
                  <Text style={styles.adaptiveRatingText}>{tacticalRating} ELO</Text>
                </View>
              </View>
              <Text style={styles.adaptiveCardSub}>
                Adaptive AI Engine: Next puzzles dynamically adapt to your tactical skill rating!
              </Text>
            </View>

            {/* 2 Segmented Tabs: To-Solve vs Solved */}
            <View style={styles.segmentContainer}>
              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  puzzleSubTab === 'to_solve' && styles.segmentBtnActive,
                ]}
                onPress={() => setPuzzleSubTab('to_solve')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    puzzleSubTab === 'to_solve' && styles.segmentTextActive,
                  ]}
                >
                  🎯 To Solve ({toSolvePuzzles.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.segmentBtn,
                  puzzleSubTab === 'solved' && styles.segmentBtnActive,
                ]}
                onPress={() => setPuzzleSubTab('solved')}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.segmentText,
                    puzzleSubTab === 'solved' && styles.segmentTextActive,
                  ]}
                >
                  ✅ Solved ({solvedPuzzles.length})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Tier Filters for 32,241 Database */}
            <View style={{ marginBottom: 6 }}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {[
                  { id: 'All', label: 'All 32.2k' },
                  { id: 'Foundation', label: '🌱 Foundation' },
                  { id: 'Pre-Intermediate', label: '⚔️ Pre-Inter' },
                  { id: 'Intermediate', label: '🛡️ Intermediate' },
                  { id: 'Advance', label: '👑 Advance' },
                ].map((tier) => {
                  const isSel = selectedTacticsTier === tier.id;
                  return (
                    <TouchableOpacity
                      key={tier.id}
                      style={[
                        styles.tierFilterPill,
                        isSel && styles.tierFilterPillActive,
                      ]}
                      onPress={() => handleTacticsTierSelect(tier.id)}
                      disabled={loadingMorePuzzles}
                    >
                      <Text
                        style={[
                          styles.tierFilterText,
                          isSel && styles.tierFilterTextActive,
                        ]}
                      >
                        {tier.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* TAB 1: TO-SOLVE PUZZLES */}
            {puzzleSubTab === 'to_solve' && (
              <View style={{ gap: 10 }}>
                {toSolvePuzzles.length === 0 ? (
                  <View style={[styles.whiteCard, { alignItems: 'center', padding: 24, gap: 8 }]}>
                    <Text style={{ fontSize: 32 }}>🏆</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textHeading }}>
                      All loaded puzzles completed!
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textBody, textAlign: 'center' }}>
                      Great job! Tap below to load the next 15 puzzles from the 32k database.
                    </Text>
                  </View>
                ) : (
                  toSolvePuzzles.map((puz) => (
                    <TouchableOpacity
                      key={puz.id}
                      style={[styles.whiteCard, styles.puzzleListItem]}
                      onPress={() => router.push(`/learn/puzzle?id=${puz.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.puzzleNumberBox}>
                        <Text style={styles.puzzleNumberText}>#{puz.number}</Text>
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.puzzleThemePill}>{puz.theme}</Text>
                          <Text style={styles.puzzleRatingPill}>{puz.rating} ELO</Text>
                        </View>
                        <Text style={styles.puzzleListTitle}>{puz.title}</Text>
                        <Text style={styles.puzzleListSub} numberOfLines={1}>
                          {puz.subtitle}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={styles.puzzleStarText}>⭐ +{puz.rating >= 1500 ? 3 : puz.rating >= 1000 ? 2 : 1} Star{puz.rating >= 1000 ? 's' : ''}</Text>
                        <View style={styles.playBadge}>
                          <Text style={styles.playBadgeText}>Play ›</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}

                {/* Load More Button from 32,241 Database */}
                <TouchableOpacity
                  style={styles.loadMoreBtn}
                  onPress={handleLoadMorePuzzles}
                  disabled={loadingMorePuzzles}
                  activeOpacity={0.8}
                >
                  {loadingMorePuzzles ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <ActivityIndicator size="small" color={COLORS.primary} />
                      <Text style={styles.loadMoreText}>Fetching from 32,241 database...</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Feather name="refresh-cw" size={16} color={COLORS.primary} />
                      <Text style={styles.loadMoreText}>
                        Load Next 15 Puzzles ({loadedPuzzles.length} / 32,241 Loaded) ⬇️
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* TAB 2: SOLVED PUZZLES HISTORY */}
            {puzzleSubTab === 'solved' && (
              <View style={{ gap: 10 }}>
                {solvedPuzzlesList.length === 0 ? (
                  <View style={[styles.whiteCard, { alignItems: 'center', padding: 24, gap: 10 }]}>
                    <Text style={{ fontSize: 36 }}>🎯</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textHeading }}>
                      No puzzles solved yet
                    </Text>
                    <Text style={{ fontSize: 12, color: COLORS.textBody, textAlign: 'center', lineHeight: 18 }}>
                      Solve tactics from the 'To Solve' tab. All your completed puzzles and solutions will be stored here!
                    </Text>
                    <TouchableOpacity
                      style={[styles.playBadge, { paddingHorizontal: 16, paddingVertical: 8, marginTop: 4 }]}
                      onPress={() => setPuzzleSubTab('to_solve')}
                    >
                      <Text style={[styles.playBadgeText, { fontSize: 13 }]}>Play First Puzzle 🚀</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  solvedPuzzlesList.map((puz) => (
                    <TouchableOpacity
                      key={puz.id}
                      style={[
                        styles.whiteCard,
                        styles.puzzleListItem,
                        { borderColor: COLORS.progressFill, backgroundColor: '#F0FFF4', borderWidth: 1.5 },
                      ]}
                      onPress={() => router.push(`/learn/puzzle?id=${puz.id}` as any)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.puzzleNumberBox, { backgroundColor: '#DCFCE7' }]}>
                        <Feather name="check" size={16} color="#059669" />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.puzzleThemePill, { backgroundColor: '#DCFCE7', color: '#15803D' }]}>
                            {puz.theme}
                          </Text>
                          <Text style={styles.puzzleRatingPill}>{puz.rating} ELO</Text>
                        </View>
                        <Text style={styles.puzzleListTitle}>{puz.title}</Text>
                        <Text style={styles.puzzleListSub} numberOfLines={1}>
                          {puz.subtitle}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 4 }}>
                        <Text style={[styles.puzzleStarText, { color: '#059669' }]}>⭐ +{puz.rating >= 1500 ? 3 : puz.rating >= 1000 ? 2 : 1} Star{puz.rating >= 1000 ? 's' : ''}</Text>
                        <View style={styles.solvedBadge}>
                          <Text style={styles.solvedBadgeText}>Review 👁️</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            )}
          </View>
        )}

        {/* TAB 3: LEARN BY GAME                                     */}
        {/* ======================================================== */}
        {activeChip === 'Learn by game' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.whiteCard}
              onPress={() => router.push('/learn/gameReview' as any)}
            >
              <Text style={styles.eyebrow}>ANNOTATED OPENINGS · INTERACTIVE</Text>
              <Text style={styles.taskTitle}>Why did that move work?</Text>
              <Text style={styles.subtitle}>
                Step through the legendary Italian Game move by move with full coach annotations.
              </Text>
              <View style={styles.reviewLaunchBtn}>
                <Text style={styles.reviewLaunchText}>Launch Opening Review ›</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* ======================================================== */}
        {/* TABS 4, 5, 6: FOUNDATION / DEVELOPING / ADVANCED         */}
        {/* ======================================================== */}
        {['Foundation', 'Developing', 'Advanced'].includes(activeChip) && (
          <View style={styles.tabContent}>
            <View style={styles.whiteCard}>
              <Text style={styles.eyebrow}>CURRICULUM CATEGORY</Text>
              <Text style={styles.taskTitle}>{activeChip} Modules</Text>
              <Text style={styles.subtitle}>
                Structured lessons covering piece powers, pawn structures, and opening fundamentals.
              </Text>
            </View>

            {LEARN_LEVELS.filter((l) => l.category === activeChip || activeChip === 'Foundation').map((lvl) => (
              <TouchableOpacity
                key={lvl.id}
                style={[styles.whiteCard, styles.curriculumItem]}
                onPress={() => handleLevelPress(lvl.id)}
              >
                <View style={styles.curriculumIconBox}>
                  <Text style={{ fontSize: 24 }}>{lvl.pieceSymbol}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.taskTitle}>{lvl.id}. {lvl.title}</Text>
                  <Text style={styles.subtitle} numberOfLines={2}>{lvl.ruleDescription}</Text>
                </View>
                <Feather name="chevron-right" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <AppFooter activeTab="learn" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  collapsibleStatsContainer: {
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statsToggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  statsToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statsToggleTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  miniStatBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  miniStatText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  statsToggleRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statsToggleAction: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsExpandedContent: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    paddingTop: 2,
    gap: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statGridCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statCardIcon: {
    fontSize: 18,
  },
  statCardVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  statCardLabel: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  progressContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  progressPct: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statIcon: { fontSize: 11 },
  statText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  chipScrollWrapper: {
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  chipScroll: { paddingHorizontal: 16, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: SIZES.radiusChip,
    backgroundColor: COLORS.background,
  },
  activeChip: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: COLORS.textBody },
  activeChipText: { color: COLORS.white },
  content: { padding: 16, paddingBottom: 60, maxWidth: 650, alignSelf: 'center', width: '100%' },
  tabContent: { gap: 16 },
  eyebrow: {
    fontSize: SIZES.fontEyebrow,
    fontWeight: FONTS.eyebrowWeight,
    letterSpacing: FONTS.eyebrowSpacing,
    color: COLORS.primary,
  },
  dailyPuzzleBanner: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: SIZES.radiusCard,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.soft,
  },
  dailyPuzzleTag: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.white,
    backgroundColor: '#D97706',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  dailyPuzzleSolvedTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  dailyPuzzleTitle: { fontSize: 15, fontWeight: '800', color: '#78350F' },
  dailyPuzzleSub: { fontSize: 11, color: '#92400E' },
  dailyPuzzleIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FDE68A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldSelector: {
    backgroundColor: COLORS.primary,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  worldTitle: { fontSize: 20, fontWeight: FONTS.headingWeight, color: COLORS.white, marginTop: 2 },
  worldDesc: { fontSize: 12, color: '#CBE3D5', marginTop: 2 },
  worldIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  worldIconText: { fontSize: 22 },
  quickGrid: { flexDirection: 'row', gap: 10 },
  quickCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  quickIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading },
  quickSub: { fontSize: 10, color: COLORS.textBody, marginTop: 1 },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  journeyPath: { gap: 12, marginTop: 8 },
  levelNodeRow: { flexDirection: 'row', width: '100%' },
  levelNodeCard: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    borderRadius: 14,
    padding: 10,
    gap: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  nodeCompleted: { borderColor: COLORS.progressFill, backgroundColor: '#F0FFF4' },
  nodeCurrent: { borderColor: COLORS.primary, borderWidth: 2, backgroundColor: '#FFFFFF' },
  nodeLocked: { opacity: 0.6, backgroundColor: '#F8FAFC' },
  levelCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  circleCompleted: { backgroundColor: COLORS.progressFill },
  circleCurrent: { backgroundColor: COLORS.primary },
  circleLocked: { backgroundColor: '#CBD5E1' },
  levelTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  levelPieceIcon: { fontSize: 16 },
  levelTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textHeading },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  starsText: { fontSize: 10, color: COLORS.textBody, marginLeft: 6, fontWeight: '600' },
  playNowTag: { fontSize: 11, color: COLORS.primary, fontWeight: '700', marginTop: 2 },
  lockedTag: { fontSize: 11, color: COLORS.textBody, marginTop: 2 },
  questItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAF7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  questTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading },
  questSub: { fontSize: 11, color: COLORS.textBody, marginTop: 2 },
  questProgressText: { fontSize: 12, fontWeight: '600', color: COLORS.textHeading },
  rewardBtn: {
    backgroundColor: COLORS.accentPeach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 2,
  },
  rewardBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 11 },
  claimedBadge: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  claimedBadgeText: { color: COLORS.primary, fontWeight: '700', fontSize: 10 },
  badgesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  badgeItem: { flex: 1, alignItems: 'center', gap: 4 },
  badgeCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  badgeLabel: { fontSize: 9, fontWeight: '700', color: COLORS.textHeading, textAlign: 'center' },
  badgeStatus: { fontSize: 8, color: COLORS.textBody },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 13, color: COLORS.textBody, marginTop: 2 },
  reviewLaunchBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  reviewLaunchText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  curriculumItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  curriculumIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F0F3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  randomLaunchBtn: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  randomLaunchText: { fontSize: 12, fontWeight: '800', color: '#92400E' },
  puzzleListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  puzzleNumberBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0F3EE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  puzzleNumberText: { fontSize: 12, fontWeight: '800', color: COLORS.textHeading },
  puzzleThemePill: {
    fontSize: 9,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  puzzleRatingPill: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  puzzleListTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textHeading, marginTop: 2 },
  puzzleListSub: { fontSize: 11, color: COLORS.textBody },
  puzzleXpText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  puzzleStarText: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  solvedBadge: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  solvedBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  playBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
  },
  playBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white },
  adaptiveCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#BFDBFE',
    gap: 4,
    marginBottom: 4,
  },
  adaptiveCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E40AF',
  },
  adaptiveRatingPill: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  adaptiveRatingText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E40AF',
  },
  adaptiveCardSub: {
    fontSize: 11,
    color: '#3B82F6',
    lineHeight: 15,
  },
  tierFilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tierFilterPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tierFilterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  tierFilterTextActive: {
    color: COLORS.white,
    fontWeight: '800',
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 3,
    gap: 4,
    marginBottom: 6,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  segmentTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  loadMoreBtn: {
    backgroundColor: '#E4EEDB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
});
