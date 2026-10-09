import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_STUDENT_STATS, SAMPLE_TASKS } from '../../data/homeData';
import { Feather } from '@expo/vector-icons';

export const StudentHome = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const firstName = user?.name ? user.name.split(' ')[0] : 'Player';

  return (
    <View style={styles.container}>
      {/* Header Area */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>MAKE YOUR NEXT MOVE</Text>
        <View style={styles.xpPill}>
          <Text style={styles.xpText}>{SAMPLE_STUDENT_STATS.xp} XP · Level {SAMPLE_STUDENT_STATS.level}</Text>
        </View>
      </View>
      
      <Text style={styles.greeting}>Hey {firstName}, ready to play?</Text>
      <Text style={styles.subtitle}>A little practice today. A better player tomorrow.</Text>

      {/* Hero Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroTop}>
          <View style={styles.heroIconSquare}>
            <Text style={styles.heroIcon}>♞</Text>
          </View>
          <Text style={styles.heroEyebrow}>PIECE EXPLORERS · WORLD 1</Text>
        </View>
        <Text style={styles.heroTitle}>Your next level. A new possibility.</Text>
        <TouchableOpacity style={styles.heroButton} onPress={() => router.push('/learn' as any)}>
          <Text style={styles.heroButtonText}>Continue level {SAMPLE_STUDENT_STATS.level}</Text>
        </TouchableOpacity>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_STUDENT_STATS.learningRating}</Text>
          <Text style={styles.statLabel}>Learning rating</Text>
          <Text style={styles.statSub}>ChessOne · not FIDE</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_STUDENT_STATS.lessonsFinished} / {SAMPLE_STUDENT_STATS.totalLessons}</Text>
          <Text style={styles.statLabel}>Lessons finished</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_STUDENT_STATS.practiceMinutesThisWeek}m</Text>
          <Text style={styles.statLabel}>Practice this week</Text>
        </View>
      </View>

      {/* Tasks */}
      <Text style={styles.sectionTitle}>Your day</Text>
      <View style={styles.whiteCard}>
        {SAMPLE_TASKS.map((task, index) => (
          <View key={task.id} style={[styles.taskRow, index < SAMPLE_TASKS.length - 1 && styles.borderBottom]}>
            <View style={styles.taskIcon}>
              <Feather name={task.type === 'level' ? 'book' : task.type === 'practice' ? 'user' : 'search'} size={16} color={COLORS.primary} />
            </View>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Feather name="chevron-right" size={18} color={COLORS.textBody} />
          </View>
        ))}
      </View>

      {/* Coming Up */}
      <Text style={styles.sectionTitle}>Coming up</Text>
      <View style={styles.whiteCard}>
        <Text style={styles.taskTitle}>School tournament next Friday!</Text>
        <Text style={[styles.statSub, { marginTop: 4 }]}>Sample data</Text>
      </View>

      {/* Quick Play */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/play' as any)}>
          <Feather name="cpu" size={24} color={COLORS.primary} />
          <Text style={styles.quickBtnText}>Play vs Computer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/play' as any)}>
          <Feather name="users" size={24} color={COLORS.primary} />
          <Text style={styles.quickBtnText}>Play a friend</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  eyebrow: {
    fontSize: SIZES.fontEyebrow,
    fontWeight: FONTS.eyebrowWeight,
    letterSpacing: FONTS.eyebrowSpacing,
    color: COLORS.textBody,
  },
  xpPill: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: SIZES.radiusChip,
  },
  xpText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  greeting: {
    fontSize: SIZES.fontHeading,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  subtitle: {
    fontSize: SIZES.fontBody,
    color: COLORS.textBody,
    marginBottom: 8,
  },
  heroCard: {
    backgroundColor: COLORS.hero,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroIconSquare: {
    width: 32,
    height: 32,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroIcon: {
    color: COLORS.white,
    fontSize: 18,
  },
  heroEyebrow: {
    fontSize: SIZES.fontEyebrow,
    fontWeight: FONTS.eyebrowWeight,
    letterSpacing: FONTS.eyebrowSpacing,
    color: COLORS.primary,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: FONTS.headingWeight,
    color: COLORS.primary,
    marginBottom: 8,
  },
  heroButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
  },
  heroButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 15,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textHeading,
    marginTop: 4,
    textAlign: 'center',
  },
  statSub: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginTop: 8,
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  taskTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 12,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    ...SHADOWS.soft,
    alignItems: 'center',
    gap: 8,
  },
  quickBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});
