import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { HOME_THEME } from '../../constants/home-theme';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export const HomeScreen = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const firstName = user?.name ? user.name.split(' ')[0] : 'Player';

  return (
    <SafeAreaView style={styles.safeArea}>
      <AppHeader rightAction="profile" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        
        {/* 2) GREETING */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingEyebrow}>MAKE YOUR NEXT MOVE</Text>
          <Text style={styles.greetingHeading}>Hey {firstName}, ready to play?</Text>
          <Text style={styles.greetingSubtitle}>A little practice today. A better player tomorrow.</Text>
        </View>

        {/* 3) HERO CARD */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>PIECE EXPLORERS · WORLD 1</Text>
          <Text style={styles.heroTitle}>Your next level. A new possibility.</Text>
          <Text style={styles.heroLine}>Level 4 · The knight's move</Text>
          
          <TouchableOpacity 
            style={styles.heroButton} 
            activeOpacity={0.8}
            onPress={() => router.push('/learn/level?id=4' as any)}
          >
            <Text style={styles.heroButtonText}>Continue level 4</Text>
          </TouchableOpacity>

          <MaterialCommunityIcons 
            name="chess-knight" 
            size={64} 
            color={HOME_THEME.colors.knightIcon} 
            style={styles.heroIcon} 
          />
        </View>

        {/* 4) STAT CARDS ROW */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Learning rating</Text>
            <Text style={styles.statValue}>640</Text>
            <Text style={styles.statSub}>+32</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Lessons finished</Text>
            <Text style={styles.statValue}>8 / 24</Text>
            <Text style={styles.statSub}>Foundation</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Practice this week</Text>
            <Text style={styles.statValue}>48 min</Text>
            <Text style={styles.statSub}>12 min to goal</Text>
          </View>
        </View>

        {/* 5) WEEKLY QUESTS CARD */}
        <View style={styles.questsCard}>
          <Text style={styles.questsTitle}>Your weekly quests</Text>
          <Text style={styles.questsSub}>1 of 3 done · 4 days left</Text>
          <View style={styles.progressTrack}>
            <View style={styles.progressFill} />
          </View>
        </View>

      </ScrollView>

      <AppFooter activeTab="home" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: HOME_THEME.colors.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: HOME_THEME.colors.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxWidth: 700,
    alignSelf: 'center',
    width: '100%',
  },
  /* 2) GREETING */
  greetingSection: {
    marginTop: 16,
  },
  greetingEyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: HOME_THEME.colors.mutedText,
  },
  greetingHeading: {
    marginTop: 6,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 31,
    color: HOME_THEME.colors.headingText,
  },
  greetingSubtitle: {
    marginTop: 4,
    fontSize: 14,
    color: HOME_THEME.colors.mutedText,
  },
  /* 3) HERO CARD */
  heroCard: {
    marginTop: 18,
    backgroundColor: HOME_THEME.colors.heroCard,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
  },
  heroEyebrow: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: HOME_THEME.colors.mutedText,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    color: HOME_THEME.colors.headingText,
    maxWidth: '75%',
  },
  heroLine: {
    marginTop: 8,
    fontSize: 14,
    color: HOME_THEME.colors.mutedText,
  },
  heroButton: {
    marginTop: 14,
    backgroundColor: HOME_THEME.colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  heroButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  heroIcon: {
    position: 'absolute',
    right: 24,
    bottom: 28,
  },
  /* 4) STAT CARDS ROW */
  statsRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: HOME_THEME.colors.whiteCard,
    borderRadius: 14,
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    color: HOME_THEME.colors.mutedText,
    textAlign: 'left',
  },
  statValue: {
    marginTop: 4,
    fontSize: 26,
    fontWeight: '800',
    color: HOME_THEME.colors.headingText,
    textAlign: 'left',
  },
  statSub: {
    marginTop: 2,
    fontSize: 11,
    color: HOME_THEME.colors.mutedText,
    textAlign: 'left',
  },
  /* 5) WEEKLY QUESTS CARD */
  questsCard: {
    marginTop: 12,
    backgroundColor: HOME_THEME.colors.whiteCard,
    borderRadius: 14,
    padding: 14,
  },
  questsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: HOME_THEME.colors.headingText,
  },
  questsSub: {
    marginTop: 2,
    fontSize: 13,
    color: HOME_THEME.colors.mutedText,
  },
  progressTrack: {
    marginTop: 10,
    height: 6,
    borderRadius: 4,
    backgroundColor: HOME_THEME.colors.progressTrack,
    width: '100%',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: HOME_THEME.colors.progressFill,
    width: '33%',
  },
});
