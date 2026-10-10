import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useLearnStore, learnStore } from '../../features/learn/learnStore';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const CHIPS = ['Level journey', 'Foundation', 'Developing', 'Advanced', 'Learn by game'];
const LEVELS = [
  { id: 1, title: 'The Chess Board' },
  { id: 2, title: 'The Pawn' },
  { id: 3, title: 'The Rook' },
  { id: 4, title: "The Knight's move" },
  { id: 5, title: 'The Bishop' },
  { id: 6, title: 'The Queen' },
];

export default function LearnScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState(CHIPS[0]);
  const { completedLevels, questProgress, collectedRewards } = useLearnStore();

  const handleLevelPress = (id: number) => {
    // If it's unlocked (id === 1 or previous is completed)
    if (id === 1 || completedLevels[id - 1]) {
      router.push(`/learn/level?id=${id}` as any);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Learn" subtitle="Master the board" />
      
      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {CHIPS.map(chip => (
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
        {activeChip === 'Level journey' && (
          <View>
            <View style={styles.worldSelector}>
              <Text style={styles.eyebrow}>WORLD 1 OF 3</Text>
              <Text style={styles.worldTitle}>Piece Explorers</Text>
            </View>

            <View style={styles.journeyPath}>
              {LEVELS.map((lvl, index) => {
                const isCompleted = !!completedLevels[lvl.id];
                const stars = completedLevels[lvl.id] || 0;
                const isUnlocked = lvl.id === 1 || !!completedLevels[lvl.id - 1];
                const isCurrent = isUnlocked && !isCompleted;

                // Simple zig-zag layout
                const marginLeft = index % 2 !== 0 ? 60 : 0;
                
                return (
                  <View key={lvl.id} style={[styles.levelNodeWrapper, { marginLeft }]}>
                    <TouchableOpacity 
                      style={[
                        styles.levelCircle, 
                        isCompleted ? styles.circleCompleted : (isCurrent ? styles.circleCurrent : styles.circleLocked)
                      ]}
                      onPress={() => handleLevelPress(lvl.id)}
                    >
                      <Feather 
                        name={isCompleted ? 'star' : (isUnlocked ? 'play' : 'lock')} 
                        size={24} 
                        color={isCompleted ? COLORS.white : (isCurrent ? COLORS.white : COLORS.border)} 
                      />
                    </TouchableOpacity>
                    <Text style={styles.levelTitle}>{lvl.id}. {lvl.title}</Text>
                    {isCompleted && (
                      <View style={styles.starsRow}>
                        {[1, 2, 3].map(s => (
                          <Feather key={s} name="star" size={12} color={s <= stars ? COLORS.accentPeach : COLORS.border} />
                        ))}
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Quests */}
            <Text style={styles.sectionTitle}>Weekly quests</Text>
            <View style={styles.whiteCard}>
              <View style={styles.questRow}>
                <Text style={styles.subtitle}>Complete a new level</Text>
                <Text style={styles.subtitle}>1/1</Text>
              </View>
              <View style={styles.questRow}>
                <Text style={styles.subtitle}>Practise with your coach</Text>
                <Text style={styles.subtitle}>0/1</Text>
              </View>
              
              {!collectedRewards.includes('q1') && (
                <View style={styles.rewardCard}>
                  <Text style={[styles.subtitle, { color: '#C86848', fontWeight: '700' }]}>Quest reward · 50 XP</Text>
                  <TouchableOpacity style={styles.rewardBtn} onPress={() => learnStore.collectReward('q1')}>
                    <Text style={styles.rewardBtnText}>Collect reward</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Badges */}
            <Text style={styles.sectionTitle}>Badge shelf</Text>
            <View style={[styles.whiteCard, styles.badgesRow]}>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: COLORS.accentPeach }]}><Feather name="award" size={20} color={COLORS.white} /></View>
                <Text style={styles.badgeLabel}>First move</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: COLORS.progressFill }]}><Feather name="zap" size={20} color={COLORS.white} /></View>
                <Text style={styles.badgeLabel}>Curious mind</Text>
              </View>
              <View style={styles.badgeItem}>
                <View style={[styles.badgeCircle, { backgroundColor: '#F0F3EE' }]}><Feather name="lock" size={20} color={COLORS.border} /></View>
                <Text style={[styles.badgeLabel, { color: COLORS.border }]}>Piece explorer</Text>
              </View>
            </View>
            
            {/* Coach One Link */}
            <TouchableOpacity style={styles.coachCard} onPress={() => router.push('/learn/practice' as any)}>
              <View style={styles.coachAvatar}><Text style={styles.coachInitial}>C1</Text></View>
              <View>
                <Text style={styles.taskTitle}>Practise with Coach One</Text>
                <Text style={styles.subtitle}>Guided practice & hints</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
        
        {activeChip === 'Learn by game' && (
          <View>
            <TouchableOpacity style={styles.whiteCard} onPress={() => router.push('/learn/gameReview' as any)}>
              <Text style={styles.taskTitle}>Why did that move work?</Text>
              <Text style={styles.subtitle}>Step through a short annotated opening.</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {['Foundation', 'Developing', 'Advanced'].includes(activeChip) && (
          <View>
            <View style={styles.whiteCard}>
              <Text style={styles.taskTitle}>{activeChip} Library</Text>
              <Text style={styles.subtitle}>Short lessons followed by a 2-3 question check.</Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <AppFooter activeTab="learn" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chipScrollWrapper: { backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chipScroll: { paddingHorizontal: 16, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusChip, backgroundColor: COLORS.background },
  activeChip: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textBody },
  activeChipText: { color: COLORS.white },
  content: { padding: 16, paddingBottom: 40, maxWidth: 700, alignSelf: 'center', width: '100%', gap: 24 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary },
  worldSelector: { alignItems: 'center', marginBottom: 16 },
  worldTitle: { fontSize: 24, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginTop: 4 },
  journeyPath: { alignItems: 'center', gap: 30, marginVertical: 20 },
  levelNodeWrapper: { alignItems: 'center', width: 100 },
  levelCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft, marginBottom: 8 },
  circleCompleted: { backgroundColor: COLORS.progressFill },
  circleCurrent: { backgroundColor: COLORS.primary },
  circleLocked: { backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border },
  levelTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading, textAlign: 'center' },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, gap: 12 },
  questRow: { flexDirection: 'row', justifyContent: 'space-between' },
  subtitle: { fontSize: 14, color: COLORS.textBody },
  rewardCard: { backgroundColor: COLORS.softPeach, borderRadius: 12, padding: 12, marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rewardBtn: { backgroundColor: COLORS.accentPeach, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  rewardBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  badgesRow: { flexDirection: 'row', justifyContent: 'space-around' },
  badgeItem: { alignItems: 'center', gap: 8 },
  badgeCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  badgeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textHeading },
  coachCard: { backgroundColor: COLORS.hero, borderRadius: SIZES.radiusCard, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  coachInitial: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
});
