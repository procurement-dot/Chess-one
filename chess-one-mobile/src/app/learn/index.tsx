import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useLearnStore, learnStore } from '../../features/learn/learnStore';
import { LEARN_LEVELS, WEEKLY_QUESTS, BADGES_DATA } from '../../data/learn';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CHIPS = ['Level journey', 'Foundation', 'Developing', 'Advanced', 'Learn by game'];

export default function LearnScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState(CHIPS[0]);
  const { completedLevels, questProgress, collectedRewards, coachPracticed, gameReviewed, totalXp } = useLearnStore();

  // Compute total stars earned
  const totalStars = useMemo(() => {
    return Object.values(completedLevels).reduce((sum, s) => sum + (s || 0), 0);
  }, [completedLevels]);

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

      {/* Top Stars & XP Summary Banner */}
      <View style={styles.statsBar}>
        <View style={styles.statBadge}>
          <Text style={styles.statIcon}>⭐</Text>
          <Text style={styles.statText}>{totalStars} Stars</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: '#E4EEDB', borderColor: '#CBD5E1' }]}>
          <Text style={styles.statIcon}>⚡</Text>
          <Text style={[styles.statText, { color: COLORS.primary }]}>{totalXp} XP</Text>
        </View>
        <View style={[styles.statBadge, { backgroundColor: '#F0F3EE', borderColor: '#E3E8DE' }]}>
          <Text style={styles.statIcon}>🏆</Text>
          <Text style={[styles.statText, { color: COLORS.textHeading }]}>{completedCount}/{LEARN_LEVELS.length} Done</Text>
        </View>
      </View>

      {/* Chips Navigation */}
      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {CHIPS.map((chip) => (
            <TouchableOpacity
              key={chip}
              style={[styles.chip, activeChip === chip && styles.activeChip]}
              onPress={() => setActiveChip(chip)}
            >
              <Text style={[styles.chipText, activeChip === chip && styles.activeChipText]}>{chip}</Text>
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

                  // Alternate alignment for zig-zag feel
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
                    : gameReviewed ? 1 : 0;
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
                          size={22}
                          color={isUnlocked ? COLORS.white : COLORS.border}
                        />
                      </View>
                      <Text style={styles.badgeLabel}>{badge.title}</Text>
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
        {/* TAB 2: LEARN BY GAME                                     */}
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
        {/* TABS 3, 4, 5: FOUNDATION / DEVELOPING / ADVANCED         */}
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
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  statIcon: { fontSize: 12 },
  statText: { fontSize: 12, fontWeight: '700', color: '#92400E' },
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
    gap: 8,
  },
  badgeItem: { flex: 1, alignItems: 'center', gap: 4 },
  badgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  badgeLabel: { fontSize: 10, fontWeight: '700', color: COLORS.textHeading, textAlign: 'center' },
  badgeStatus: { fontSize: 9, color: COLORS.textBody },
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
});
