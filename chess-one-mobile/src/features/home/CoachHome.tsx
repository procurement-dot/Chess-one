import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { DEMO_COACH_DATA } from '../../mock/schoolDemo';

export const CoachHome = () => {
  const [activeTab, setActiveTab] = useState<'Dashboard' | 'Batches' | 'Students'>('Dashboard');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>COACH WORKSPACE</Text>
          <Text style={styles.heading}>Your next star starts here.</Text>
          <Text style={styles.subheading}>Manage live batches, student progress & game reviews.</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>Create a batch</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['Dashboard', 'Batches', 'Students'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Coach Framework Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Coach level</Text>
          <Text style={styles.statValue}>{DEMO_COACH_DATA.level}</Text>
          <Text style={styles.statSub}>FIDE Accredited</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Coach points</Text>
          <Text style={styles.statValue}>{DEMO_COACH_DATA.points}</Text>
          <Text style={[styles.statSub, { color: COLORS.progressFill, fontWeight: '700' }]}>★ 4.8 rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Active learners</Text>
          <Text style={styles.statValue}>{DEMO_COACH_DATA.learnersCount}</Text>
          <Text style={styles.statSub}>2 live batches</Text>
        </View>
      </View>

      {/* Next Live Class */}
      <View style={[styles.whiteCard, { backgroundColor: '#FAF7F0', borderColor: '#F0E6D2' }]}>
        <Text style={[styles.eyebrow, { color: '#C86848' }]}>NEXT LIVE CLASS</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={styles.taskTitle}>{DEMO_COACH_DATA.nextClass.title}</Text>
            <Text style={styles.subtitle}>{DEMO_COACH_DATA.nextClass.time} · {DEMO_COACH_DATA.nextClass.students} students</Text>
          </View>
          <TouchableOpacity style={styles.conductBtn}>
            <Text style={styles.conductBtnText}>Conduct class</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Batches Section */}
      <View style={styles.whiteCard}>
        <Text style={styles.sectionTitle}>My batches</Text>
        {DEMO_COACH_DATA.batches.map((batch) => (
          <View key={batch.id} style={styles.batchItem}>
            <View style={{ flex: 1 }}>
              <Text style={styles.taskTitle}>{batch.title}</Text>
              <Text style={styles.statSub}>{batch.time} · {batch.enrolled}/{batch.capacity} enrolled</Text>
            </View>
            <TouchableOpacity style={styles.outlineBtn}>
              <Text style={styles.outlineBtnText}>Enrolment</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Celebrations */}
      <View style={styles.whiteCard}>
        <Text style={styles.sectionTitle}>Students worth celebrating</Text>
        {DEMO_COACH_DATA.celebrations.map((cel, idx) => (
          <View key={idx} style={styles.celebrationRow}>
            <Text style={styles.celebrationText}>{cel}</Text>
          </View>
        ))}
      </View>

      {/* Students Table */}
      <View style={styles.whiteCard}>
        <Text style={styles.sectionTitle}>Students & review</Text>
        {DEMO_COACH_DATA.students.map((student, idx) => (
          <View key={idx} style={[styles.studentRow, idx < DEMO_COACH_DATA.students.length - 1 && styles.borderBottom]}>
            <View>
              <Text style={styles.taskTitle}>{student.name}</Text>
              <Text style={styles.statSub}>{student.batch} · Rating: {student.rating}</Text>
            </View>
            <TouchableOpacity style={styles.reviewBtn}>
              <Text style={styles.reviewBtnText}>Review learner</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  headerRow: { gap: 10 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.textHeading },
  subheading: { fontSize: 13, color: COLORS.textBody, marginTop: 2 },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusButton,
    alignSelf: 'flex-start',
  },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: COLORS.hero,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 12,
    ...SHADOWS.soft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 10, color: COLORS.textBody, fontWeight: '600', textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginVertical: 2 },
  statSub: { fontSize: 9, color: COLORS.textBody, textAlign: 'center' },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textHeading },
  taskTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 12, color: COLORS.textBody },
  conductBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  conductBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
  batchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  outlineBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
  celebrationRow: {
    backgroundColor: COLORS.hero,
    padding: 10,
    borderRadius: 10,
  },
  celebrationText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  studentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  reviewBtn: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewBtnText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
});
