import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { DEMO_SCHOOL_DATA } from '../../mock/schoolDemo';
import { StudentProgressReportModal } from '../../components/modals/StudentProgressReportModal';

export const SchoolHome = () => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  const handleOpenStudentReport = (studentName: string) => {
    setSelectedStudent(studentName);
    setReportModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>SCHOOL WORKSPACE</Text>
          <Text style={styles.heading}>Every child gets a next move.</Text>
          <Text style={styles.subheading}>Greenwood School · Grade 5 A · Term 1 chess programme</Text>
        </View>
        <TouchableOpacity style={styles.assignBtn} activeOpacity={0.8}>
          <Text style={styles.assignBtnText}>Assign a lesson</Text>
        </TouchableOpacity>
      </View>
      
      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Students enrolled</Text>
          <Text style={styles.statValue}>{DEMO_SCHOOL_DATA.enrolled}</Text>
          <Text style={styles.statSub}>4 classes · Sample roster</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Weekly completion</Text>
          <Text style={[styles.statValue, { color: COLORS.progressFill }]}>{DEMO_SCHOOL_DATA.weeklyCompletion}%</Text>
          <Text style={styles.statSub}>94 of 120 students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Need a little support</Text>
          <Text style={[styles.statValue, { color: '#C86848' }]}>{DEMO_SCHOOL_DATA.needSupport}</Text>
          <Text style={styles.statSub}>Suggested teacher follow-up</Text>
        </View>
      </View>

      {/* Schedule Card */}
      <View style={styles.whiteCard}>
        <Text style={styles.sectionTitle}>Learning that fits your school day</Text>
        <Text style={styles.subtitle}>{DEMO_SCHOOL_DATA.schedule.title}</Text>
        <Text style={[styles.statSub, { marginBottom: 10 }]}>{DEMO_SCHOOL_DATA.schedule.days}</Text>

        {DEMO_SCHOOL_DATA.assignments.map((assignment, idx) => (
          <View key={idx} style={[styles.assignmentRow, idx < DEMO_SCHOOL_DATA.assignments.length - 1 && styles.borderBottom]}>
            <View>
              <Text style={styles.taskTitle}>{assignment.title}</Text>
              <Text style={styles.statSub}>{assignment.class} · {assignment.due} · {assignment.progress} completed</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Assigned</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.offlineBtn} activeOpacity={0.8}>
          <Text style={styles.offlineBtnText}>Record offline session</Text>
        </TouchableOpacity>
      </View>

      {/* Class learning snapshot */}
      <View style={styles.whiteCard}>
        <Text style={styles.sectionTitle}>Class learning snapshot</Text>
        {DEMO_SCHOOL_DATA.skillsSnapshot.map((skill, idx) => (
          <View key={idx} style={{ marginTop: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={styles.subtitle}>{skill.name}</Text>
              <Text style={styles.taskTitle}>{skill.progress}%</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${skill.progress}%` }]} />
            </View>
          </View>
        ))}
        <Text style={[styles.statSub, { marginTop: 8 }]}>Suggested class focus: protecting the king before launching an attack.</Text>
      </View>

      {/* Students & Follow-up Table */}
      <View style={styles.whiteCard}>
        <View style={styles.rosterHeader}>
          <Text style={styles.sectionTitle}>Students & follow-up</Text>
          <View style={styles.classChip}>
            <Text style={styles.classChipText}>Grade 5 A</Text>
          </View>
        </View>

        {DEMO_SCHOOL_DATA.studentsRoster.map((student, idx) => (
          <View key={idx} style={[styles.rosterRow, idx < DEMO_SCHOOL_DATA.studentsRoster.length - 1 && styles.borderBottom]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.studentName}>{student.name}</Text>
              <Text style={styles.statSub}>{student.path} · {student.status}</Text>
            </View>
            <TouchableOpacity
              style={styles.viewStudentBtn}
              activeOpacity={0.8}
              onPress={() => handleOpenStudentReport(student.name)}
            >
              <Text style={styles.viewStudentBtnText}>View student</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Student Progress Report Modal */}
      <StudentProgressReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        studentName={selectedStudent || 'Aarav'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  headerRow: {
    gap: 10,
    marginBottom: 4,
  },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.textHeading },
  subheading: { fontSize: 13, color: COLORS.textBody, marginTop: 2 },
  assignBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusButton,
    alignSelf: 'flex-start',
  },
  assignBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
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
  statValue: { fontSize: 18, fontWeight: '800', color: COLORS.primary, marginVertical: 2 },
  statSub: { fontSize: 9, color: COLORS.textBody, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textHeading },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  taskTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 12, color: COLORS.textBody },
  assignmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  badge: { backgroundColor: COLORS.hero, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  offlineBtn: { backgroundColor: COLORS.background, paddingVertical: 10, borderRadius: SIZES.radiusButton, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border, marginTop: 6 },
  offlineBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
  progressBarBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 3 },
  rosterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  classChip: { backgroundColor: COLORS.background, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: COLORS.border },
  classChipText: { fontSize: 10, fontWeight: '700', color: COLORS.textHeading },
  rosterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9 },
  studentName: { fontSize: 13, fontWeight: '700', color: COLORS.textHeading },
  viewStudentBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  viewStudentBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
});
