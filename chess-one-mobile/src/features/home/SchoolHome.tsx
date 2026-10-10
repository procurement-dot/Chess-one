import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_SCHOOL_DATA } from '../../data/homeData';

export const SchoolHome = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SCHOOL WORKSPACE</Text>
      
      <View style={[styles.whiteCard, { backgroundColor: COLORS.hero }]}>
        <Text style={[styles.taskTitle, { color: COLORS.primary, fontSize: 20 }]}>Learning that fits your school day</Text>
      </View>

      <Text style={styles.sectionTitle}>Assigned lessons</Text>
      <View style={styles.whiteCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.taskTitle}>World 1 curriculum</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Assigned</Text>
          </View>
        </View>
        <Text style={[styles.subtitle, { marginTop: 8 }]}>{SAMPLE_SCHOOL_DATA.completedLessons}/{SAMPLE_SCHOOL_DATA.assignedLessons} students completed</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn}>
        <Text style={styles.primaryBtnText}>Record offline session</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Class learning snapshot</Text>
      <View style={styles.whiteCard}>
        {SAMPLE_SCHOOL_DATA.skills.map((skill, idx) => (
          <View key={idx} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.subtitle}>{skill.name}</Text>
              <Text style={styles.taskTitle}>{skill.progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${skill.progress}%` }]} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginTop: 8 },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 14, color: COLORS.textBody },
  badge: { backgroundColor: COLORS.accentPeach, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: SIZES.radiusButton, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  progressBarBg: { height: 8, backgroundColor: COLORS.progressTrack, borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.progressFill, borderRadius: 4 },
});
