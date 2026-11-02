import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { useLearnStore, learnStore } from '../learn/learnStore';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { Feather } from '@expo/vector-icons';
import { DEMO_STUDENT_REPORT, DEMO_DAILY_MOVES, DEMO_COACH_ONE_TIP, DEMO_CALENDAR_EVENTS } from '../../mock/schoolDemo';
import { StudentProgressReportModal } from '../../components/modals/StudentProgressReportModal';

export const StudentHome = () => {
  const { user } = useAuthStore();
  const router = useRouter();
  
  const firstName = user?.name ? user.name.split(' ')[0] : 'Aarav';

  const {
    isPlacementComplete,
    placementGamesCompleted,
    placementTier,
    tacticalRating,
    startingLevelId,
    completedLevels,
    totalXp,
  } = useLearnStore();

  const [showPlacementModal, setShowPlacementModal] = useState<boolean>(false);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  const handleSimulateGame = (won: boolean = true) => {
    const accuracy = won ? Math.floor(Math.random() * 15) + 75 : Math.floor(Math.random() * 20) + 45;
    const moves = Math.floor(Math.random() * 10) + 14;
    const nextGame = placementGamesCompleted + 1;
    
    learnStore.recordPlacementGame(won, accuracy, moves, won ? 0 : 1);
    setShowPlacementModal(false);

    if (nextGame >= 5) {
      setTimeout(() => {
        setShowResultModal(true);
      }, 400);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. YOUR CHESS WORLD Section */}
      <View style={styles.whiteCard}>
        <View style={styles.worldHeader}>
          <View>
            <Text style={styles.worldEyebrow}>YOUR CHESS WORLD</Text>
            <Text style={styles.worldTitle}>Let’s play it.</Text>
            <Text style={styles.worldSubtitle}>A thoughtful move is a little victory.</Text>
          </View>
          <Text style={styles.worldKnight}>♞</Text>
        </View>

        <View style={styles.playEntryGrid}>
          {/* Play with Coach One */}
          <TouchableOpacity
            style={styles.playEntryCard}
            activeOpacity={0.7}
            onPress={() => router.push('/play/create?mode=ai' as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.playEntryTitle}>Play with Coach One</Text>
              <Text style={styles.playEntrySub}>Friendly guidance · Your level</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Play a real person */}
          <TouchableOpacity
            style={styles.playEntryCard}
            activeOpacity={0.7}
            onPress={() => router.push('/community' as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.playEntryTitle}>Play a real person</Text>
              <Text style={styles.playEntrySub}>School & junior clubs</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>

          {/* Challenge a friend */}
          <TouchableOpacity
            style={styles.playEntryCard}
            activeOpacity={0.7}
            onPress={() => router.push('/play/create?mode=pvp' as any)}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.playEntryTitle}>Challenge a friend</Text>
              <Text style={styles.playEntrySub}>Your chess circle</Text>
            </View>
            <Feather name="arrow-up-right" size={16} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Header Greeting & XP Pill */}
      <View style={styles.headerRow}>
        <Text style={styles.eyebrow}>MAKE YOUR NEXT MOVE</Text>
        <View style={styles.xpPill}>
          <Text style={styles.xpText}>
            ✦ {totalXp} XP · {isPlacementComplete ? `Level ${startingLevelId}` : `Placement ${placementGamesCompleted}/5`}
          </Text>
        </View>
      </View>
      
      <Text style={styles.greeting}>Hey {firstName}, ready to play?</Text>
      <Text style={styles.subtitle}>A little practice today. A better player tomorrow.</Text>

      {/* 4. Dynamic Hero Card: AI Placement Assessment (0/5) vs Calibrated Level */}
      {!isPlacementComplete ? (
        <View style={[styles.heroCard, styles.heroAssessmentCard]}>
          <View style={styles.heroTop}>
            <View style={[styles.heroIconSquare, { backgroundColor: '#F59E0B' }]}>
              <Text style={{ fontSize: 16 }}>🎯</Text>
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.heroAssessmentEyebrow}>
                AI PLACEMENT ASSESSMENT · {placementGamesCompleted} / 5
              </Text>
            </View>
            <View style={styles.placementPill}>
              <Text style={styles.placementPillText}>
                {Math.round((placementGamesCompleted / 5) * 100)}% Done
              </Text>
            </View>
          </View>

          <Text style={[styles.heroTitle, { color: COLORS.white }]}>
            Find Your Chess Skill Level
          </Text>
          <Text style={[styles.heroDesc, { color: '#CBD5E1' }]}>
            Play 5 timed 1.5-min blitz matches with Coach One. Our AI will analyze your tactical speed & accuracy to calibrate your starting level!
          </Text>

          <View style={styles.placementTrackBar}>
            <View
              style={[
                styles.placementFillBar,
                { width: `${Math.max(6, (placementGamesCompleted / 5) * 100)}%` },
              ]}
            />
          </View>

          <TouchableOpacity
            style={styles.placementActionBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/learn/placement' as any)}
          >
            <Text style={styles.placementActionBtnText}>
              {placementGamesCompleted === 0
                ? 'Start Match 1 (1.5 Min Blitz) 🚀'
                : `Play Match ${placementGamesCompleted + 1} (1.5 Min) ▶`}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View style={styles.heroIconSquare}>
              <Text style={styles.heroIcon}>♞</Text>
            </View>
            <Text style={styles.heroEyebrow}>
              PIECE EXPLORERS · WORLD {startingLevelId > 10 ? 2 : 1}
            </Text>
          </View>
          <Text style={styles.heroTitle}>Your next level. A new possibility.</Text>
          <Text style={styles.heroDesc}>
            Level {startingLevelId} · Master new tactical motifs, earn stars and unlock your next challenge!
          </Text>
          <TouchableOpacity
            style={styles.heroButton}
            onPress={() => router.push(`/learn/level?id=${startingLevelId}` as any)}
          >
            <Text style={styles.heroButtonText}>Continue Level {startingLevelId} ▶</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={{ marginTop: 10, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 }}
            onPress={() => {
              learnStore.resetPlacement();
              router.push('/learn/placement' as any);
            }}
            activeOpacity={0.7}
          >
            <Feather name="rotate-ccw" size={13} color={COLORS.primary} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.primary }}>
              Retake 1.5-Min Placement Matches
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Stats Row (Live Placement & Store Progress) */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {tacticalRating} <Text style={{ fontSize: 12, color: COLORS.progressFill }}>ELO</Text>
          </Text>
          <Text style={styles.statLabel}>Skill Rating</Text>
          <Text style={styles.statSub}>
            {isPlacementComplete ? (placementTier || 'Calibrated') : 'Evaluating...'}
          </Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {Object.keys(completedLevels).filter((k) => completedLevels[Number(k)] > 0).length}
            <Text style={{ fontSize: 13, color: COLORS.textBody }}> / 30</Text>
          </Text>
          <Text style={styles.statLabel}>Lessons Mastered</Text>
          <Text style={styles.statSub}>Curriculum roadmap</Text>
        </View>
        <TouchableOpacity
          style={styles.statCard}
          onPress={() => {
            if (isPlacementComplete) {
              learnStore.resetPlacement();
            }
            router.push('/learn/placement' as any);
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.statValue}>
            {placementGamesCompleted} <Text style={{ fontSize: 13 }}>/ 5</Text>
          </Text>
          <Text style={styles.statLabel}>Placement Games</Text>
          <Text style={[styles.statSub, { color: COLORS.progressFill, fontWeight: '700' }]}>
            {isPlacementComplete ? 'Retake 1.5-Min ›' : `${5 - placementGamesCompleted} remaining`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. Your Daily Moves (1 of 3 done) */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Your daily moves</Text>
        <Text style={styles.sectionCounter}>1 of 3 done</Text>
      </View>
      <View style={styles.whiteCard}>
        {DEMO_DAILY_MOVES.map((task, index) => (
          <TouchableOpacity
            key={task.id}
            style={[styles.taskRow, index < DEMO_DAILY_MOVES.length - 1 && styles.borderBottom]}
            activeOpacity={0.7}
            onPress={() => router.push(task.actionRoute as any)}
          >
            <View style={[styles.taskIcon, task.done && { backgroundColor: COLORS.progressFill }]}>
              <Text style={{ color: task.done ? COLORS.white : COLORS.primary, fontWeight: '800' }}>
                {task.icon}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.taskTitle, task.done && { textDecorationLine: 'line-through', color: COLORS.textBody }]}>
                {task.title}
              </Text>
              <Text style={styles.taskSub}>{task.subtitle}</Text>
            </View>
            <Feather name={task.done ? "check" : "chevron-right"} size={18} color={task.done ? COLORS.progressFill : COLORS.textBody} />
          </TouchableOpacity>
        ))}
      </View>

      {/* 7. Learn from your last game */}
      <View style={styles.whiteCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>Learn from your last game</Text>
          <TouchableOpacity onPress={() => router.push('/analysis' as any)}>
            <Text style={styles.cardLinkText}>Open review</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.cardBodyText}>
          Your pieces want to join the action. Let’s look at one move that helps them.
        </Text>
        <View style={styles.tagRow}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>Piece development</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: COLORS.softPeach }]}>
            <Text style={[styles.tagText, { color: '#C86848' }]}>1 moment to practise</Text>
          </View>
        </View>
      </View>

      {/* 8. Coach One Card */}
      <View style={styles.coachCard}>
        <View style={styles.coachHead}>
          <View style={styles.coachAvatarCircle}>
            <Text style={{ fontSize: 22 }}>🧙‍♂️</Text>
          </View>
          <View>
            <Text style={styles.coachName}>Coach One</Text>
            <Text style={styles.coachRole}>Your witty, patient chess companion</Text>
          </View>
        </View>
        <Text style={styles.coachQuote}>
          {DEMO_COACH_ONE_TIP.quote}
        </Text>
        <TouchableOpacity
          style={styles.coachBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/play/create?mode=ai' as any)}
        >
          <Text style={styles.coachBtnText}>Play with Coach One</Text>
        </TouchableOpacity>

        {/* Today's Focus */}
        <View style={styles.todayFocusBox}>
          <Text style={styles.todayFocusEyebrow}>TODAY’S FOCUS</Text>
          <Text style={styles.todayFocusTitle}>{DEMO_COACH_ONE_TIP.todaysFocus.title}</Text>
          <Text style={styles.todayFocusDesc}>{DEMO_COACH_ONE_TIP.todaysFocus.description}</Text>
        </View>
      </View>

      {/* 9. On your calendar */}
      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>On your calendar</Text>
        <TouchableOpacity onPress={() => router.push('/tournaments' as any)}>
          <Text style={styles.cardLinkText}>View all</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.whiteCard}>
        {DEMO_CALENDAR_EVENTS.map((event, index) => (
          <View key={event.id} style={[styles.eventRow, index < DEMO_CALENDAR_EVENTS.length - 1 && styles.borderBottom]}>
            <View style={styles.dateBox}>
              <Text style={styles.dateMonth}>{event.month}</Text>
              <Text style={styles.dateDay}>{event.day}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventCategory}>{event.category}</Text>
            </View>
            <TouchableOpacity
              style={styles.exploreEventBtn}
              onPress={() => router.push('/tournaments' as any)}
            >
              <Text style={styles.exploreEventBtnText}>Explore</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* 10. Make it yours (60% profile completion) */}
      <View style={styles.whiteCard}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeading}>Make it yours</Text>
          <Text style={styles.progressPercent}>60%</Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '60%' }]} />
        </View>
        <Text style={styles.cardBodyText}>
          Add your guardian’s details and chess background to complete your profile.
        </Text>
        <TouchableOpacity onPress={() => router.push('/login' as any)}>
          <Text style={styles.cardLinkText}>Complete profile</Text>
        </TouchableOpacity>
      </View>

      {/* 11. Learn with a real coach */}
      <View style={styles.whiteCard}>
        <Text style={styles.cardHeading}>Learn with a real coach</Text>
        <Text style={styles.cardBodyText}>
          Join a small live batch or explore a self-paced course. Meet the coach, see their experience and follow a structured learning plan.
        </Text>
        <TouchableOpacity
          style={styles.classesBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/classes' as any)}
        >
          <Text style={styles.classesBtnText}>Explore courses & classes</Text>
        </TouchableOpacity>
      </View>

      {/* 12. Quick Actions (Original & Working) */}
      <Text style={styles.sectionTitle}>Quick actions</Text>
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/play/create?mode=ai' as any)}>
          <Feather name="cpu" size={24} color={COLORS.primary} />
          <Text style={styles.quickBtnText}>Play vs Computer</Text>
          <Text style={styles.quickBtnSub}>Practice AI engine</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickBtn} onPress={() => router.push('/play/create?mode=pvp' as any)}>
          <Feather name="users" size={24} color={COLORS.primary} />
          <Text style={styles.quickBtnText}>Play a friend</Text>
          <Text style={styles.quickBtnSub}>PvP room match</Text>
        </TouchableOpacity>
      </View>
      {/* MODAL 1: Placement Game Launcher */}
      <Modal visible={showPlacementModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.placementModalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalBadgeText}>🎯 AI ASSESSMENT · GAME {placementGamesCompleted + 1} OF 5</Text>
              <TouchableOpacity onPress={() => setShowPlacementModal(false)}>
                <Feather name="x" size={20} color={COLORS.textBody} />
              </TouchableOpacity>
            </View>

            <View style={{ alignItems: 'center', gap: 6, marginVertical: 8 }}>
              <Text style={{ fontSize: 36 }}>🧙‍♂️</Text>
              <Text style={styles.modalTitle}>Mission {placementGamesCompleted + 1}: Match Assessment</Text>
              <Text style={styles.modalDesc}>
                Play with Coach One! Our AI monitors your opening development, piece protection, and tactical vision.
              </Text>
            </View>

            <View style={styles.missionBox}>
              <Text style={styles.missionTitle}>Game Objective:</Text>
              <Text style={styles.missionText}>
                {placementGamesCompleted === 0 && 'Control the center and develop your Knights and Bishops.'}
                {placementGamesCompleted === 1 && 'Look for safe squares and defend any attacked pieces.'}
                {placementGamesCompleted === 2 && 'Find double attacks (Forks and Pins) to gain material.'}
                {placementGamesCompleted === 3 && 'Castle your King to safety and coordinate your Rooks.'}
                {placementGamesCompleted === 4 && 'Execute clean tactics and hunt for the decisive checkmate!'}
              </Text>
            </View>

            <View style={{ gap: 8, marginTop: 8 }}>
              <TouchableOpacity
                style={styles.modalPlayBtn}
                onPress={() => {
                  setShowPlacementModal(false);
                  router.push('/learn/placement' as any);
                }}
              >
                <Text style={styles.modalPlayBtnText}>Play Diagnostic Challenge ▶</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSimBtn}
                onPress={() => handleSimulateGame(true)}
              >
                <Text style={styles.modalSimBtnText}>⚡ Simulate Match Outcome (Win)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: AI Diagnostic Assessment Result Modal */}
      <Modal visible={showResultModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultModalCard}>
            <View style={styles.resultTrophyBox}>
              <Text style={{ fontSize: 32 }}>🏆</Text>
            </View>

            <Text style={styles.resultModalTitle}>Placement Complete!</Text>
            <Text style={styles.resultModalSub}>
              Coach One AI analyzed 5 games across your openings, tactics, and endgame decisions:
            </Text>

            <View style={styles.resultPillBox}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.resultPillLabel}>SKILL LEVEL</Text>
                <Text style={styles.resultPillValue}>🛡️ {placementTier || 'Intermediate'}</Text>
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: '#86EFAC' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.resultPillLabel}>STARTING ELO</Text>
                <Text style={styles.resultPillValue}>{tacticalRating} ELO</Text>
              </View>
            </View>

            {/* Metrics Breakdown */}
            <View style={{ gap: 8, marginVertical: 6 }}>
              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricName}>Tactical Vision & Pins</Text>
                  <Text style={[styles.metricScore, { color: '#059669' }]}>86% (Strong)</Text>
                </View>
                <View style={styles.metricTrack}>
                  <View style={[styles.metricFill, { width: '86%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricName}>Opening & Piece Development</Text>
                  <Text style={[styles.metricScore, { color: '#059669' }]}>78% (Solid)</Text>
                </View>
                <View style={styles.metricTrack}>
                  <View style={[styles.metricFill, { width: '78%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.metricRow}>
                <View style={styles.metricLabelRow}>
                  <Text style={styles.metricName}>King Safety & Defense</Text>
                  <Text style={[styles.metricScore, { color: '#D97706' }]}>64% (Focus Area)</Text>
                </View>
                <View style={styles.metricTrack}>
                  <View style={[styles.metricFill, { width: '64%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            <View style={styles.verdictBox}>
              <Text style={styles.verdictText}>
                💡 <Text style={{ fontWeight: '800' }}>Coach One Verdict:</Text> You possess sharp tactical calculation! We have unlocked Levels 1–{startingLevelId - 1} so you can jump right into Level {startingLevelId}!
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalPlayBtn}
              onPress={() => {
                setShowResultModal(false);
                router.push(`/learn/level?id=${startingLevelId}` as any);
              }}
            >
              <Text style={styles.modalPlayBtnText}>Unlock & Continue Level {startingLevelId} ▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  heroAssessmentCard: {
    backgroundColor: '#183D3D',
    borderWidth: 1.5,
    borderColor: '#2D6A4F',
  },
  heroAssessmentEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    letterSpacing: 0.8,
  },
  placementPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  placementPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  placementTrackBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 4,
  },
  placementFillBar: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  placementActionBtn: {
    backgroundColor: '#F59E0B',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...SHADOWS.soft,
  },
  placementActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  placementModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    gap: 8,
    ...SHADOWS.soft,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.textHeading,
    textAlign: 'center',
  },
  modalDesc: {
    fontSize: 12,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 17,
  },
  missionBox: {
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  missionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  missionText: {
    fontSize: 12,
    color: COLORS.textHeading,
    lineHeight: 16,
  },
  modalPlayBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  modalPlayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
  modalSimBtn: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  modalSimBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  resultModalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    width: '100%',
    maxWidth: 420,
    gap: 10,
    ...SHADOWS.soft,
  },
  resultTrophyBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  resultModalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: COLORS.textHeading,
    textAlign: 'center',
  },
  resultModalSub: {
    fontSize: 12,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 16,
  },
  resultPillBox: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  resultPillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  resultPillValue: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
  },
  metricRow: {
    gap: 3,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  metricScore: {
    fontSize: 11,
    fontWeight: '700',
  },
  metricTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricFill: {
    height: '100%',
    borderRadius: 3,
  },
  verdictBox: {
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 10,
  },
  verdictText: {
    fontSize: 11,
    color: COLORS.textHeading,
    lineHeight: 16,
  },

  reportBannerCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E0D8',
    gap: 12,
    ...SHADOWS.soft,
  },
  reportBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  reportIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  reportBannerSub: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  openReportBtn: {
    backgroundColor: '#C86848',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
  },
  openReportBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  worldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  worldEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.progressFill,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  worldTitle: {
    fontSize: 18,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
  },
  worldSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
  },
  worldKnight: {
    fontSize: 26,
    color: COLORS.primary,
  },
  playEntryGrid: {
    gap: 8,
  },
  playEntryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playEntryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  playEntrySub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginBottom: 4,
  },
  heroCard: {
    backgroundColor: COLORS.hero,
    borderRadius: SIZES.radiusCard,
    padding: 20,
    gap: 8,
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
    fontSize: 18,
    fontWeight: FONTS.headingWeight,
    color: COLORS.primary,
  },
  heroDesc: {
    fontSize: 12,
    color: COLORS.primary,
    opacity: 0.85,
    lineHeight: 17,
  },
  heroButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
    marginTop: 4,
  },
  heroButtonText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
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
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textHeading,
    marginTop: 2,
    textAlign: 'center',
  },
  statSub: {
    fontSize: 9,
    color: COLORS.textBody,
    marginTop: 1,
    textAlign: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  sectionCounter: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  taskIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  taskSub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  cardLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },
  cardBodyText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 17,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
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
  coachCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 10,
  },
  coachHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  coachAvatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  coachRole: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  coachQuote: {
    backgroundColor: COLORS.background,
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    fontSize: 12,
    fontStyle: 'italic',
    color: COLORS.textHeading,
    lineHeight: 17,
  },
  coachBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: 9,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
  },
  coachBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  todayFocusBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#F0E6D2',
    gap: 2,
  },
  todayFocusEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C86848',
    letterSpacing: 1,
  },
  todayFocusTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  todayFocusDesc: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 10,
  },
  dateBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateMonth: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 9,
  },
  dateDay: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
    lineHeight: 14,
  },
  eventTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  eventCategory: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  exploreEventBtn: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  exploreEventBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '800',
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
    backgroundColor: COLORS.progressFill,
    borderRadius: 3,
  },
  classesBtn: {
    backgroundColor: COLORS.background,
    paddingVertical: 10,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  classesBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quickRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  quickBtnSub: {
    fontSize: 10,
    color: COLORS.textBody,
  },
});
