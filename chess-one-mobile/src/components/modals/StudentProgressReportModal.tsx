import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { DEMO_STUDENT_REPORT, StudentProgressReportData } from '../../mock/schoolDemo';

interface StudentProgressReportModalProps {
  visible: boolean;
  onClose: () => void;
  data?: StudentProgressReportData;
  studentName?: string;
}

export const StudentProgressReportModal: React.FC<StudentProgressReportModalProps> = ({
  visible,
  onClose,
  data = DEMO_STUDENT_REPORT,
  studentName,
}) => {
  const router = useRouter();
  const displayName = studentName || data.studentName;

  const [weeklySummaryToggle, setWeeklySummaryToggle] = useState(data.permissions.weeklySummary);
  const [friendInvitesToggle, setFriendInvitesToggle] = useState(data.permissions.friendInvites);

  const handleOpenDetailedProgress = () => {
    onClose();
    router.push('/progress' as any);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>STUDENT PROGRESS REPORT</Text>
              <Text style={styles.modalTitle}>Student progress report · {displayName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Feather name="x" size={20} color={COLORS.textHeading} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            {/* Notice banner */}
            <View style={styles.noticeBanner}>
              <Text style={styles.noticeText}>
                Sample weekly report · Demo observations, not a live engine assessment.
              </Text>
            </View>

            {/* Headline and summary */}
            <Text style={styles.headline}>{data.headline}</Text>
            <Text style={styles.summaryText}>
              {displayName} is practising how pieces move, how to use the centre and how to check for threats.
            </Text>

            {/* 3 Main Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Lessons finished</Text>
                <Text style={styles.statVal}>{data.lessonsFinished}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Weekly practice</Text>
                <Text style={styles.statVal}>{data.weeklyPracticeMinutes} min</Text>
                <Text style={styles.statSub}>Goal: {data.practiceGoalMinutes} min</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Placement games</Text>
                <Text style={styles.statVal}>{data.placementGamesFinished} / {data.placementGamesTotal}</Text>
              </View>
            </View>

            {/* What is improving? */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>What is improving?</Text>
              {data.whatIsImproving.map((item, idx) => (
                <Text key={idx} style={styles.bodyText}>
                  <Text style={{ fontWeight: '700', color: COLORS.primary }}>{item.title}: </Text>
                  {item.detail}
                </Text>
              ))}
            </View>

            {/* What needs practice? */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>What needs practice?</Text>
              <Text style={styles.bodyText}>{data.whatNeedsPractice}</Text>
            </View>

            {/* Your next goal */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>Your next goal</Text>
              <Text style={styles.bodyText}>{data.nextGoal}</Text>
            </View>

            {/* A question to think about */}
            <View style={styles.coachBubble}>
              <Text style={styles.coachBubbleTag}>A QUESTION TO THINK ABOUT</Text>
              <Text style={styles.coachBubbleText}>“{data.questionToThinkAbout}”</Text>
            </View>

            {/* Skills Mastery progress bars */}
            <View style={styles.sectionBox}>
              <Text style={styles.sectionHeading}>Your chess toolkit</Text>
              {data.skillsMastery.map((skill, idx) => (
                <View key={idx} style={styles.skillRow}>
                  <View style={styles.skillLabelRow}>
                    <Text style={styles.skillName}>{skill.name}</Text>
                    <Text style={styles.skillPct}>{skill.progress}%</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${skill.progress}%` }]} />
                  </View>
                </View>
              ))}
            </View>

            {/* School & coach */}
            <View style={styles.infoCard}>
              <Text style={styles.infoRow}>
                <Text style={{ fontWeight: '700' }}>School tasks: </Text>
                {data.schoolTasksFinished} / {data.schoolTasksTotal} (One lesson left this week)
              </Text>
              <Text style={styles.infoRow}>
                <Text style={{ fontWeight: '700' }}>Coach: </Text>
                {data.coachName} · {data.pathway}
              </Text>
              <Text style={styles.infoRow}>
                <Text style={{ fontWeight: '700' }}>Learning rating: </Text>
                {data.learningRating} (sample). Separate from FIDE rating.
              </Text>
            </View>

            {/* Permissions & activities */}
            <View style={styles.permissionsCard}>
              <Text style={styles.sectionHeading}>Permissions & activities</Text>
              
              <View style={styles.activityItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activityTitle}>{data.permissions.eventTitle}</Text>
                  <Text style={styles.activitySub}>
                    {data.permissions.eventDate} · {data.permissions.eventAge} · ₹{data.permissions.eventFee}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    onClose();
                    router.push('/tournaments' as any);
                  }}
                >
                  <Text style={styles.reviewBtnText}>Review entry</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Weekly learning summary</Text>
                <Switch
                  value={weeklySummaryToggle}
                  onValueChange={setWeeklySummaryToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>

              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Allow school-managed friend invitations</Text>
                <Switch
                  value={friendInvitesToggle}
                  onValueChange={setFriendInvitesToggle}
                  trackColor={{ false: COLORS.border, true: COLORS.primary }}
                  thumbColor={COLORS.white}
                />
              </View>
            </View>

            {/* FIDE Notice */}
            <Text style={styles.fideNoticeText}>{data.fideNotice}</Text>

            {/* Action button: Open detailed progress */}
            <TouchableOpacity
              style={styles.detailedProgressBtn}
              activeOpacity={0.85}
              onPress={handleOpenDetailedProgress}
            >
              <Text style={styles.detailedProgressBtnText}>Open detailed progress</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    padding: 20,
    ...SHADOWS.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#C86848',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flexGrow: 1,
  },
  scrollContent: {
    gap: 14,
    paddingBottom: 20,
  },
  noticeBanner: {
    backgroundColor: COLORS.hero,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  noticeText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    lineHeight: 16,
  },
  headline: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  summaryText: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textBody,
    fontWeight: '600',
    textAlign: 'center',
  },
  statVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    color: COLORS.textBody,
    marginTop: 1,
  },
  sectionBox: {
    gap: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  coachBubble: {
    backgroundColor: '#FAF7F0',
    borderRadius: 14,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#C86848',
    borderWidth: 1,
    borderColor: '#F0E6D2',
    gap: 4,
  },
  coachBubbleTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C86848',
    letterSpacing: 1,
  },
  coachBubbleText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
    fontStyle: 'italic',
  },
  skillRow: {
    gap: 4,
    marginTop: 6,
  },
  skillLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  skillName: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  skillPct: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressTrack: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  infoCard: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 12,
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  infoRow: {
    fontSize: 11,
    color: COLORS.textBody,
    lineHeight: 16,
  },
  permissionsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 10,
    borderRadius: 12,
  },
  activityTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  activitySub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  reviewBtn: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleText: {
    fontSize: 12,
    color: COLORS.textHeading,
    fontWeight: '500',
    flex: 1,
  },
  fideNoticeText: {
    fontSize: 10,
    color: COLORS.textBody,
    lineHeight: 14,
    fontStyle: 'italic',
  },
  detailedProgressBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  detailedProgressBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
});
