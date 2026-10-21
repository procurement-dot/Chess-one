import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';
import { StudentProgressReportModal } from '../components/modals/StudentProgressReportModal';
import { DEMO_STUDENT_REPORT } from '../mock/schoolDemo';

export default function ProgressScreen() {
  const router = useRouter();
  const [reportModalVisible, setReportModalVisible] = useState(false);

  // Spark chart values
  const chartBars = [35, 44, 50, 62, 74, 90];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* MY REPORT Banner (Replaces parent banner for student) */}
        <View style={styles.myReportBanner}>
          <View style={{ flex: 1 }}>
            <Text style={styles.reportEyebrow}>MY REPORT</Text>
            <Text style={styles.reportTitle}>See how you are growing.</Text>
            <Text style={styles.reportSub}>Skills, practice, school tasks and your next goal in simple words.</Text>
          </View>
          <TouchableOpacity
            style={styles.openReportBtn}
            activeOpacity={0.8}
            onPress={() => setReportModalVisible(true)}
          >
            <Text style={styles.openReportBtnText}>Progress report</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.title}>Progress is more than a number.</Text>
        <Text style={styles.subtitle}>See what’s improving, and where your next lesson can help.</Text>

        {/* 6-Week Learning Journey Chart */}
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Your learning journey</Text>
            <View style={styles.tag}><Text style={styles.tagText}>Last 6 weeks</Text></View>
          </View>
          <View style={styles.ratingLine}>
            <Text style={styles.bigRating}>640</Text>
            <Text style={styles.ratingDelta}>+120 learning points</Text>
          </View>
          <View style={styles.chartRow}>
            {chartBars.map((val, idx) => (
              <View key={idx} style={styles.barCol}>
                <View style={[styles.barTrack, { height: 90 }]}>
                  <View style={[
                    styles.barFill, 
                    { height: `${val}%` },
                    idx === chartBars.length - 1 && { backgroundColor: COLORS.primary }
                  ]} />
                </View>
                <Text style={styles.barLabel}>W{idx + 1}</Text>
              </View>
            ))}
          </View>
          <Text style={styles.footnote}>
            ChessOne learning rating measures app progress. It is not a FIDE rating.
          </Text>
        </View>

        {/* Chess Toolkit */}
        <Text style={styles.sectionTitle}>Your chess toolkit</Text>
        <View style={styles.card}>
          <SkillBar label="Piece movement" percent={86} />
          <SkillBar label="Centre control" percent={72} />
          <SkillBar label="Piece safety" percent={58} />
          <SkillBar label="Planning ahead" percent={40} />
        </View>

        {/* Next best focus */}
        <View style={[styles.card, { backgroundColor: '#FAF7F0', borderColor: '#F0E6D2' }]}>
          <Text style={styles.cardTitle}>Your next best focus</Text>
          <Text style={styles.bodyText}>
            You sometimes leave a piece unprotected. Try a short piece-safety lesson, then practise with Coach One.
          </Text>
          <TouchableOpacity
            style={styles.lessonBtn}
            onPress={() => router.push('/learn' as any)}
          >
            <Text style={styles.lessonBtnText}>Start recommended lesson</Text>
          </TouchableOpacity>
        </View>

        {/* Learning Milestones */}
        <Text style={styles.sectionTitle}>Learning milestones</Text>
        <View style={styles.card}>
          <View style={styles.milestoneRow}>
            <Text style={styles.checkIcon}>✓</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>Meet all six pieces</Text>
              <Text style={styles.milestoneSub}>Completed · Foundation</Text>
            </View>
          </View>
          <View style={[styles.milestoneRow, styles.borderTop]}>
            <Text style={styles.pieceIcon}>♞</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.milestoneTitle}>Move the knight confidently</Text>
              <Text style={styles.milestoneSub}>Assessment available</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Student Progress Report Modal */}
      <StudentProgressReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        studentName={DEMO_STUDENT_REPORT.studentName}
      />
    </SafeAreaView>
  );
}

const SkillBar = ({ label, percent }: { label: string; percent: number }) => (
  <View style={styles.skillContainer}>
    <View style={styles.skillHeader}>
      <Text style={styles.skillLabel}>{label}</Text>
      <Text style={styles.skillPercent}>{percent}%</Text>
    </View>
    <View style={styles.progressBarBg}>
      <View style={[styles.progressBarFill, { width: `${percent}%` }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  content: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
    maxWidth: 650,
    alignSelf: 'center',
    width: '100%',
  },
  myReportBanner: {
    backgroundColor: '#FCEEE6',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F4D2C3',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reportEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C86848',
    letterSpacing: 1,
  },
  reportTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  reportSub: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  openReportBtn: {
    backgroundColor: '#C86848',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  openReportBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
    ...SHADOWS.soft,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  tag: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  ratingLine: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  bigRating: {
    fontSize: 24,
    fontWeight: '900',
    color: COLORS.primary,
  },
  ratingDelta: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.progressFill,
  },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 105,
    paddingTop: 10,
  },
  barCol: {
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  barTrack: {
    width: 14,
    backgroundColor: COLORS.border,
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: COLORS.progressFill,
    borderRadius: 7,
  },
  barLabel: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  footnote: {
    fontSize: 10,
    color: COLORS.textBody,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  skillContainer: {
    marginBottom: 8,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skillLabel: {
    fontSize: 12,
    color: COLORS.textHeading,
  },
  skillPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressBarBg: {
    height: 7,
    backgroundColor: COLORS.progressTrack,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  lessonBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  lessonBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  milestoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  borderTop: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkIcon: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.progressFill,
  },
  pieceIcon: {
    fontSize: 16,
    color: COLORS.primary,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  milestoneSub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
});
