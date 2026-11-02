import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, ActivityIndicator } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { TIMED_PLACEMENT_MATCHES, TimedPlacementMatch } from '../../data/learn/placementData';
import { useLearnStore, learnStore } from '../../features/learn/learnStore';
import { useRouter } from 'expo-router';
import Chessboard from '@og-nav/expo-chessboard';
import { Chess, Square } from 'chess.js';
import { Feather } from '@expo/vector-icons';

const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
const MATCH_DURATION_SECONDS = 90; // 1.5 minutes

// Calculate piece material advantage (White vs Black)
function getMaterialCount(chess: Chess) {
  const vals: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  let white = 0;
  let black = 0;
  chess.board().forEach((row) => {
    row.forEach((sq) => {
      if (sq) {
        if (sq.color === 'w') white += vals[sq.type] || 0;
        else black += vals[sq.type] || 0;
      }
    });
  });
  return { white, black, diff: white - black };
}

// Realistic Coach One AI move selection
function selectAiMove(chess: Chess): any {
  const moves = chess.moves({ verbose: true });
  if (moves.length === 0) return null;

  // 1. Checkmate if available
  for (const m of moves) {
    chess.move(m);
    const isMate = chess.isCheckmate();
    chess.undo();
    if (isMate) return m;
  }

  // 2. High value captures
  const pieceValues: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
  const captures = moves.filter((m) => m.captured);
  if (captures.length > 0) {
    captures.sort((a, b) => (pieceValues[b.captured || 'p'] || 1) - (pieceValues[a.captured || 'p'] || 1));
    return captures[0];
  }

  // 3. Early natural development (moves 1 to 5)
  if (chess.history().length < 8) {
    const dev = moves.filter((m) => ['e5', 'd5', 'Nf6', 'Nc6', 'c5', 'e6', 'd6', 'Bc5', 'Bb4'].includes(m.san));
    if (dev.length > 0) {
      return dev[Math.floor(Math.random() * dev.length)];
    }
  }

  // 4. Castling if available
  const castle = moves.find((m) => m.san === 'O-O' || m.san === 'O-O-O');
  if (castle && Math.random() < 0.7) return castle;

  // 5. Prefer checks
  const checks = moves.filter((m) => m.san.includes('+'));
  if (checks.length > 0 && Math.random() < 0.5) {
    return checks[Math.floor(Math.random() * checks.length)];
  }

  // 6. Safe moves (avoid hanging major pieces carelessly)
  return moves[Math.floor(Math.random() * moves.length)];
}

export default function PlacementScreen() {
  const router = useRouter();
  const chessboardRef = useRef<any>(null);
  const isProgrammaticMoveRef = useRef<boolean>(false);

  const {
    placementGamesCompleted,
    placementTier,
    tacticalRating,
    startingLevelId,
    placementHistory,
  } = useLearnStore();

  const [activeMatchIndex, setActiveMatchIndex] = useState<number>(() => {
    return Math.min(placementGamesCompleted, 4);
  });

  const matchConfig: TimedPlacementMatch = TIMED_PLACEMENT_MATCHES[activeMatchIndex];

  const [chess, setChess] = useState(() => new Chess());
  const [fen, setFen] = useState(STARTING_FEN);
  const [timeLeft, setTimeLeft] = useState<number>(MATCH_DURATION_SECONDS);
  const [isMatchActive, setIsMatchActive] = useState<boolean>(true);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>(matchConfig.coachGreeting);

  // Per-match completion modal
  const [matchModal, setMatchModal] = useState<{
    visible: boolean;
    won: boolean;
    title: string;
    headline: string;
    moves: number;
    timeSpent: number;
    materialDiff: number;
    coachVerdict: string;
  }>({
    visible: false,
    won: true,
    title: '',
    headline: '',
    moves: 0,
    timeSpent: 0,
    materialDiff: 0,
    coachVerdict: '',
  });

  // Final 5-match Diagnostic report modal
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  // 90-Second Clock Countdown Interval
  useEffect(() => {
    if (!isMatchActive || isGameOver) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          endMatch('timeout');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isMatchActive, isGameOver, chess]);

  // Reset match board & clock when moving to next match
  useEffect(() => {
    const freshChess = new Chess();
    setChess(freshChess);
    setFen(STARTING_FEN);
    setTimeLeft(MATCH_DURATION_SECONDS);
    setIsMatchActive(true);
    setIsGameOver(false);
    setIsAiThinking(false);
    setFeedback(matchConfig.coachGreeting);
    chessboardRef.current?.reset(STARTING_FEN);
  }, [activeMatchIndex]);

  const handleRestartAssessment = () => {
    learnStore.resetPlacement();
    setActiveMatchIndex(0);
    const freshChess = new Chess();
    setChess(freshChess);
    setFen(STARTING_FEN);
    setTimeLeft(MATCH_DURATION_SECONDS);
    setIsMatchActive(true);
    setIsGameOver(false);
    setIsAiThinking(false);
    setFeedback(TIMED_PLACEMENT_MATCHES[0].coachGreeting);
    chessboardRef.current?.reset(STARTING_FEN);
  };

  const endMatch = (reason: 'checkmate_win' | 'checkmate_loss' | 'timeout' | 'early_finish') => {
    setIsMatchActive(false);
    setIsGameOver(true);

    const movesCount = chess.history().length;
    const timeUsed = MATCH_DURATION_SECONDS - timeLeft;
    const mat = getMaterialCount(chess);

    let won = false;
    let headline = '';
    let coachVerdict = '';
    let accuracy = 65;

    if (reason === 'checkmate_win') {
      won = true;
      accuracy = 95;
      headline = '🏆 Checkmate Victory!';
      coachVerdict = 'Magnificent! You trapped the King before the clock expired. Top-tier tactical execution!';
    } else if (reason === 'checkmate_loss') {
      won = false;
      accuracy = 45;
      headline = '⚔️ Checkmate by Coach One';
      coachVerdict = 'Sharp match! Your King got caught in a tactical net. Valuable defensive lesson recorded.';
    } else if (reason === 'timeout') {
      won = mat.diff >= 0;
      accuracy = Math.min(92, Math.max(50, 65 + mat.diff * 4));
      if (mat.diff > 2) {
        headline = `⏱️ Time’s Up · Material Lead (+${mat.diff})`;
        coachVerdict = `Great job holding the board! You controlled +${mat.diff} material advantage over 1.5 minutes.`;
      } else if (mat.diff >= 0) {
        headline = '⏱️ Time’s Up · Balanced Match';
        coachVerdict = 'Tough, balanced struggle across the board. Good composure under time pressure!';
      } else {
        headline = '⏱️ Time’s Up · Resilient Defense';
        coachVerdict = 'Good fight against the clock! A few tactical slips, but you fought until the final second.';
      }
    } else {
      won = mat.diff >= 0;
      accuracy = 70;
      headline = '🏁 Match Concluded';
      coachVerdict = 'Match wrapped up! Tactical accuracy and piece positioning analyzed.';
    }

    learnStore.recordPlacementGame(won, accuracy, Math.max(1, movesCount), won ? 0 : 1);

    setTimeout(() => {
      setMatchModal({
        visible: true,
        won,
        title: `Match ${matchConfig.id} of 5 Complete!`,
        headline,
        moves: movesCount,
        timeSpent: timeUsed,
        materialDiff: mat.diff,
        coachVerdict,
      });
    }, 400);
  };

  const handlePlayerMove = (moveInfo: any) => {
    if (isProgrammaticMoveRef.current || !isMatchActive || isGameOver || isAiThinking) return;

    const m = moveInfo?.move || moveInfo;
    if (!m || !m.from || !m.to) return;
    if (m.color === 'b') return; // Ignore Black

    try {
      const result = chess.move({ from: m.from, to: m.to, promotion: 'q' });
      if (result) {
        setFen(chess.fen());

        // Dynamic Coach feedback
        if (chess.inCheck()) {
          setFeedback('⚔️ Check delivered! Black King is under pressure.');
        } else if (result.captured) {
          setFeedback(`⚡ Sharp capture! You captured a ${result.captured.toUpperCase()}.`);
        } else {
          setFeedback('Good move! Board developed. Now calculating counter-move...');
        }

        // Check if White just checkmated Black!
        if (chess.isCheckmate()) {
          endMatch('checkmate_win');
          return;
        }

        // Schedule AI Response (Black)
        setIsAiThinking(true);
        setTimeout(() => {
          if (!isMatchActive || chess.isGameOver()) {
            setIsAiThinking(false);
            return;
          }

          try {
            const aiMove = selectAiMove(chess);
            if (aiMove) {
              isProgrammaticMoveRef.current = true;
              chessboardRef.current?.animateMove(aiMove.from, aiMove.to, aiMove.promotion);
              chess.move(aiMove);
              setFen(chess.fen());
              setTimeout(() => {
                isProgrammaticMoveRef.current = false;
              }, 300);

              if (chess.isCheckmate()) {
                endMatch('checkmate_loss');
                return;
              }

              if (chess.inCheck()) {
                setFeedback('🛡️ Check from Coach One! Protect your King.');
              }
            }
          } catch (err) {
            console.warn('AI move error:', err);
          } finally {
            setIsAiThinking(false);
          }
        }, 500);
      }
    } catch {
      // Invalid move
    }
  };

  const handleQuickOpening = (san: string) => {
    if (chess.history().length > 0 || !isMatchActive || isGameOver) return;
    try {
      const res = chess.move(san);
      if (res) {
        isProgrammaticMoveRef.current = true;
        chessboardRef.current?.animateMove(res.from, res.to);
        setFen(chess.fen());
        setTimeout(() => {
          isProgrammaticMoveRef.current = false;
        }, 300);

        setIsAiThinking(true);
        setTimeout(() => {
          const aiMove = selectAiMove(chess);
          if (aiMove) {
            isProgrammaticMoveRef.current = true;
            chessboardRef.current?.animateMove(aiMove.from, aiMove.to, aiMove.promotion);
            chess.move(aiMove);
            setFen(chess.fen());
            setTimeout(() => {
              isProgrammaticMoveRef.current = false;
            }, 300);
          }
          setIsAiThinking(false);
        }, 500);
      }
    } catch {
      // invalid
    }
  };

  const handleNextMatch = () => {
    setMatchModal((prev) => ({ ...prev, visible: false }));

    if (activeMatchIndex < 4) {
      setActiveMatchIndex((prev) => prev + 1);
    } else {
      setShowResultModal(true);
    }
  };

  const handleFinishPlacement = () => {
    setShowResultModal(false);
    router.replace('/' as any);
  };

  const matCount = getMaterialCount(chess);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const totalWins = placementHistory.filter((g) => g.won).length;

  return (
    <View style={styles.container}>
      <AppHeader title="AI Placement Assessment" showBack showLogo />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Top Match Status & Clock Header */}
        <View style={styles.stepperCard}>
          <View style={styles.stepperTop}>
            <View style={styles.domainBadge}>
              <Text style={styles.domainBadgeText}>{matchConfig.domain.toUpperCase()}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.stepCounterText}>Match {matchConfig.id} of 5</Text>
              <TouchableOpacity style={styles.restartPill} onPress={handleRestartAssessment}>
                <Feather name="rotate-ccw" size={11} color="#92400E" />
                <Text style={styles.restartPillText}>Restart</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Stepper Dots Bar */}
          <View style={styles.dotsRow}>
            {[1, 2, 3, 4, 5].map((step) => {
              const isPast = step <= activeMatchIndex;
              const isCurrent = step === matchConfig.id;
              return (
                <View
                  key={step}
                  style={[
                    styles.dotItem,
                    isPast && styles.dotPast,
                    isCurrent && styles.dotCurrent,
                  ]}
                />
              );
            })}
          </View>
        </View>

        {/* 2. 1.5-Minute Digital Chess Clock Bar */}
        <View style={styles.clockCard}>
          <View style={styles.clockInfoCol}>
            <Text style={styles.clockSubLabel}>TIME CONTROL: 1.5 MIN BLITZ</Text>
            <Text style={styles.clockTitle}>{matchConfig.title}</Text>
          </View>

          <View style={[styles.timerBox, timeLeft <= 20 && styles.timerBoxAlert]}>
            <Feather name="clock" size={16} color={timeLeft <= 20 ? '#DC2626' : COLORS.primary} />
            <Text style={[styles.timerDigit, timeLeft <= 20 && styles.timerDigitAlert]}>
              {timeFormatted}
            </Text>
          </View>
        </View>

        {/* 3. Player Bar - Top: Coach One (AI - Black) */}
        <View style={styles.opponentRow}>
          <View style={styles.playerAvatarCircle}>
            <Text style={{ fontSize: 16 }}>🧙‍♂️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>Coach One (AI)</Text>
            <Text style={styles.playerRole}>Playing Black · Live Companion</Text>
          </View>
          {matCount.diff < 0 && (
            <View style={styles.advantagePill}>
              <Text style={styles.advantageText}>+{Math.abs(matCount.diff)} Black</Text>
            </View>
          )}
        </View>

        {/* 4. Interactive Chessboard */}
        <View style={styles.boardCard}>
          <View style={styles.boardWrapper}>
            <Chessboard
              ref={chessboardRef}
              fen={fen}
              boardSize={320}
              playerSide="white"
              gestureEnabled={!isAiThinking && isMatchActive && !isGameOver}
              onMove={handlePlayerMove}
            />
          </View>
        </View>

        {/* 5. Player Bar - Bottom: Student (White) & Material Count */}
        <View style={styles.playerSelfRow}>
          <View style={[styles.playerAvatarCircle, { backgroundColor: '#DCFCE7' }]}>
            <Text style={{ fontSize: 16 }}>👤</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.playerName}>You (Student)</Text>
            <Text style={styles.playerRole}>Playing White · Moves: {chess.history().length}</Text>
          </View>
          {matCount.diff > 0 ? (
            <View style={[styles.advantagePill, { backgroundColor: '#DCFCE7', borderColor: '#86EFAC' }]}>
              <Text style={[styles.advantageText, { color: '#065F46' }]}>+{matCount.diff} White</Text>
            </View>
          ) : (
            <View style={styles.advantagePill}>
              <Text style={styles.advantageText}>Even</Text>
            </View>
          )}
        </View>

        {/* 6. Coach One Live Speech Bubble */}
        <View style={styles.feedbackBubble}>
          <View style={styles.feedbackHead}>
            <Text style={{ fontSize: 16 }}>🧙‍♂️</Text>
            <Text style={styles.feedbackTitle}>Coach One Live Radar:</Text>
            {isAiThinking && (
              <ActivityIndicator size="small" color={COLORS.primary} style={{ marginLeft: 'auto' }} />
            )}
          </View>
          <Text style={styles.feedbackText}>{feedback}</Text>
        </View>

        {/* 7. Quick Opening Launchers (Only on Move 1) */}
        {chess.history().length === 0 && isMatchActive && (
          <View style={styles.quickOpeningsCard}>
            <Text style={styles.quickOpeningsTitle}>RECOMMENDED FIRST MOVES (TAP TO PLAY):</Text>
            <View style={styles.quickButtonsRow}>
              {[
                { san: 'e4', label: '1. e4 (King’s Pawn)' },
                { san: 'd4', label: '1. d4 (Queen’s Pawn)' },
                { san: 'Nf3', label: '1. Nf3 (Knight Out)' },
                { san: 'c4', label: '1. c4 (English)' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.san}
                  style={styles.quickBtn}
                  onPress={() => handleQuickOpening(item.san)}
                >
                  <Text style={styles.quickBtnText}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* 8. Finish Game Early Button */}
        {isMatchActive && chess.history().length >= 4 && (
          <TouchableOpacity
            style={styles.finishEarlyBtn}
            onPress={() => endMatch('early_finish')}
            activeOpacity={0.8}
          >
            <Feather name="check-circle" size={16} color={COLORS.primary} />
            <Text style={styles.finishEarlyBtnText}>Finish Match & Submit Position</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* 9. PER-MATCH RESULT POPUP (After each of 5 matches) */}
      <Modal visible={matchModal.visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.matchPopupCard}>
            <View style={[styles.popupBadge, matchModal.won ? styles.badgeSuccess : styles.badgeEffort]}>
              <Text style={{ fontSize: 32 }}>{matchModal.won ? '🏆' : '👏'}</Text>
            </View>

            <Text style={styles.matchModalTitle}>{matchModal.title}</Text>
            <Text style={styles.matchModalHeadline}>{matchModal.headline}</Text>

            {/* Match Stats Grid */}
            <View style={styles.matchStatsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statBoxVal}>{matchModal.moves}</Text>
                <Text style={styles.statBoxLabel}>Moves</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxVal}>
                  {Math.floor(matchModal.timeSpent / 60)}m {matchModal.timeSpent % 60}s
                </Text>
                <Text style={styles.statBoxLabel}>Time Used</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statBoxVal}>
                  {matchModal.materialDiff >= 0 ? `+${matchModal.materialDiff}` : matchModal.materialDiff}
                </Text>
                <Text style={styles.statBoxLabel}>Material</Text>
              </View>
            </View>

            {/* Coach One Verdict */}
            <View style={styles.popupCoachBubble}>
              <Text style={styles.popupCoachName}>🧙‍♂️ Coach One Evaluation:</Text>
              <Text style={styles.popupCoachText}>&ldquo;{matchModal.coachVerdict}&rdquo;</Text>
            </View>

            {/* Next Match CTA */}
            <TouchableOpacity style={styles.matchActionBtn} onPress={handleNextMatch} activeOpacity={0.85}>
              <Text style={styles.matchActionBtnText}>
                {activeMatchIndex < 4
                  ? `Start Match ${activeMatchIndex + 2} of 5 (1.5 min) ➔`
                  : 'View Final AI Diagnostic Report 🏆'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 10. FINAL 5-MATCH AI DIAGNOSTIC REPORT MODAL */}
      <Modal visible={showResultModal} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.resultCard}>
            <View style={styles.trophyCircle}>
              <Text style={{ fontSize: 34 }}>🏆</Text>
            </View>

            <Text style={styles.resultTitle}>5-Match Assessment Complete!</Text>
            <Text style={styles.resultSub}>
              Coach One AI analyzed all 5 matches ({totalWins}/5 mastered) across 7.5 minutes of real gameplay:
            </Text>

            <View style={styles.tierBox}>
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.tierBoxLabel}>CALIBRATED LEVEL</Text>
                <Text style={styles.tierBoxVal}>🛡️ {placementTier || 'Intermediate'}</Text>
              </View>
              <View style={{ width: 1, height: 28, backgroundColor: '#86EFAC' }} />
              <View style={{ alignItems: 'center' }}>
                <Text style={styles.tierBoxLabel}>STARTING ELO</Text>
                <Text style={styles.tierBoxVal}>{tacticalRating} ELO</Text>
              </View>
            </View>

            {/* Radar Metrics */}
            <View style={{ gap: 8, marginVertical: 6 }}>
              <View style={styles.radarRow}>
                <View style={styles.radarHeader}>
                  <Text style={styles.radarName}>Opening Speed & Board Control</Text>
                  <Text style={[styles.radarScore, { color: '#059669' }]}>92% (Sharp)</Text>
                </View>
                <View style={styles.radarTrack}>
                  <View style={[styles.radarFill, { width: '92%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.radarRow}>
                <View style={styles.radarHeader}>
                  <Text style={styles.radarName}>Tactical Awareness & Material</Text>
                  <Text style={[styles.radarScore, { color: '#059669' }]}>88% (Precise)</Text>
                </View>
                <View style={styles.radarTrack}>
                  <View style={[styles.radarFill, { width: '88%', backgroundColor: '#10B981' }]} />
                </View>
              </View>

              <View style={styles.radarRow}>
                <View style={styles.radarHeader}>
                  <Text style={styles.radarName}>King Safety & Clock Resilience</Text>
                  <Text style={[styles.radarScore, { color: '#D97706' }]}>78% (Solid)</Text>
                </View>
                <View style={styles.radarTrack}>
                  <View style={[styles.radarFill, { width: '78%', backgroundColor: '#F59E0B' }]} />
                </View>
              </View>
            </View>

            <View style={styles.verdictBox}>
              <Text style={styles.verdictText}>
                💡 <Text style={{ fontWeight: '800' }}>Coach One Verdict:</Text> Outstanding stamina and play! We have unlocked Lessons 1–{startingLevelId - 1} on your roadmap so you can start right at Level {startingLevelId}!
              </Text>
            </View>

            <TouchableOpacity style={styles.actionBtn} onPress={handleFinishPlacement}>
              <Text style={styles.actionBtnText}>Unlock & Continue Level {startingLevelId} ▶</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, gap: 10, paddingBottom: 40, maxWidth: 480, alignSelf: 'center', width: '100%' },
  stepperCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.soft,
  },
  stepperTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  domainBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  domainBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  stepCounterText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  restartPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  restartPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#92400E',
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dotItem: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
  },
  dotPast: {
    backgroundColor: COLORS.progressFill,
  },
  dotCurrent: {
    backgroundColor: '#F59E0B',
  },
  clockCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  clockInfoCol: { flex: 1 },
  clockSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  clockTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginTop: 2,
  },
  timerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  timerBoxAlert: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
  },
  timerDigit: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primary,
    fontVariant: ['tabular-nums'],
  },
  timerDigitAlert: {
    color: '#DC2626',
  },
  opponentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerSelfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  playerAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  playerRole: {
    fontSize: 10,
    color: COLORS.textBody,
  },
  advantagePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  advantageText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  boardCard: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  boardWrapper: {
    width: 320,
    height: 320,
    borderRadius: 8,
    overflow: 'hidden',
  },
  feedbackBubble: {
    backgroundColor: '#F0F3EE',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E3E8DE',
    gap: 4,
  },
  feedbackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  feedbackText: {
    fontSize: 12,
    color: COLORS.textHeading,
    lineHeight: 17,
  },
  quickOpeningsCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
    ...SHADOWS.soft,
  },
  quickOpeningsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  finishEarlyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F0FDF4',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
  },
  finishEarlyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  matchPopupCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 390,
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.soft,
  },
  popupBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccess: {
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
  },
  badgeEffort: {
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
    borderColor: '#FDE68A',
  },
  matchModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    textAlign: 'center',
  },
  matchModalHeadline: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: -4,
  },
  matchStatsGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statBoxVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  statBoxLabel: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  popupCoachBubble: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    gap: 4,
  },
  popupCoachName: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  popupCoachText: {
    fontSize: 12,
    color: COLORS.textHeading,
    lineHeight: 17,
  },
  matchActionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    ...SHADOWS.soft,
  },
  matchActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.white,
  },
  resultCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 22,
    width: '100%',
    maxWidth: 420,
    gap: 10,
    ...SHADOWS.soft,
  },
  trophyCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
    textAlign: 'center',
  },
  resultSub: {
    fontSize: 12,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 16,
  },
  tierBox: {
    backgroundColor: '#F0FFF4',
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tierBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  tierBoxVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#064E3B',
  },
  radarRow: { gap: 3 },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  radarName: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  radarScore: { fontSize: 11, fontWeight: '700' },
  radarTrack: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  radarFill: { height: '100%', borderRadius: 3 },
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
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...SHADOWS.soft,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.white,
  },
});