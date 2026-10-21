import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_PARENT_DATA } from '../../data/homeData';

export const ParentHome = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>PARENT WORKSPACE</Text>
      <Text style={styles.greeting}>{SAMPLE_PARENT_DATA.childName} is finding their rhythm.</Text>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_PARENT_DATA.weeklyPractice}m</Text>
          <Text style={styles.statLabel}>Weekly practice</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_PARENT_DATA.schoolTasksCompleted}/{SAMPLE_PARENT_DATA.schoolTasksTotal}</Text>
          <Text style={styles.statLabel}>School tasks</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{SAMPLE_PARENT_DATA.learningRating}</Text>
          <Text style={styles.statLabel}>Learning rating</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>What your child learned</Text>
      <View style={[styles.whiteCard, { backgroundColor: COLORS.softPeach }]}>
        <Text style={[styles.heroEyebrow, { color: '#C86848' }]}>RECENT TOPIC</Text>
        <Text style={[styles.taskTitle, { marginTop: 4, marginBottom: 12 }]}>{SAMPLE_PARENT_DATA.recentTopic}</Text>
        <Text style={[styles.statLabel, { textAlign: 'left' }]}>Ask tonight:</Text>
        <Text style={styles.subtitle}>&quot;{SAMPLE_PARENT_DATA.prompt}&quot;</Text>
      </View>

      <Text style={styles.sectionTitle}>Approvals</Text>
      {SAMPLE_PARENT_DATA.pendingApprovals.map((appr) => (
        <View key={appr.id} style={styles.whiteCard}>
          <Text style={styles.taskTitle}>{appr.title}</Text>
          <Text style={styles.subtitle}>{appr.type}</Text>
          <TouchableOpacity style={styles.approveBtn}>
            <Text style={styles.approveBtnText}>Approve</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  greeting: { fontSize: SIZES.fontHeading, fontWeight: FONTS.headingWeight, color: COLORS.textHeading },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, alignItems: 'center' },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  statLabel: { fontSize: 12, fontWeight: '600', color: COLORS.textHeading, marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginTop: 8 },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft },
  heroEyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 14, color: COLORS.textBody, marginTop: 4 },
  approveBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, borderRadius: SIZES.radiusButton, alignItems: 'center', marginTop: 12 },
  approveBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
