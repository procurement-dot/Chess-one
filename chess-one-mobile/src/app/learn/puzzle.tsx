import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { CHESS_PUZZLES, PuzzleItem, getPuzzleById, getNextPuzzleId } from '../../data/learn';
import { learnStore, useLearnStore } from '../../features/learn/learnStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Chessboard from '@og-nav/expo-chessboard';
import { Chess } from 'chess.js';
import { Feather } from '@expo/vector-icons';

export default function PuzzleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { solvedPuzzles } = useLearnStore();

  const puzzleId = (typeof id === 'string' && id) ? id : 'puz-01';
  const puzzle = getPuzzleById(puzzleId) || CHESS_PUZZLES[0];

  const [chess, setChess] = useState(() => new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success'>('idle');
  const [feedback, setFeedback] = useState<string>(puzzle.coachHint);

  // Re-initialize state when switching to another puzzle
  useEffect(() => {
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setFen(puzzle.fen);
    setSelectedChoice(null);
    setHintUsed(false);
    setStatus('idle');
    setFeedback(`Look at Black's King position. Find the decisive tactic for White!`);
  }, [puzzle.id, puzzle.fen]);

  const handleChoice = (choiceIndex: number) => {
    setSelectedChoice(choiceIndex);
    const choice = puzzle.choices[choiceIndex];

    if (choice.isCorrect) {
      try {
        chess.move(puzzle.solutionSan);
        setFen(chess.fen());
      } catch (e) {
        console.warn('Puzzle move error:', e);
      }

      setStatus('success');
      setFeedback(choice.coachFeedback);
      learnStore.recordPuzzleSolved(puzzle.id, puzzle.xpReward);
    } else {
      setStatus('wrong');
      setFeedback(choice.coachFeedback);
    }
  };

  const handleHint = () => {
    setHintUsed(true);
    setFeedback(`💡 Coach One Hint: ${puzzle.coachHint}`);
  };

  const handleReset = () => {
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setFen(puzzle.fen);
    setSelectedChoice(null);
    setStatus('idle');
    setFeedback(`Board reset! What is the strongest tactical candidate move?`);
  };

  const navigateToPuzzle = (targetId: string) => {
    router.replace(`/learn/puzzle?id=${targetId}` as any);
  };

  const handleNextPuzzle = () => {
    const nextId = getNextPuzzleId(puzzle.id);
    navigateToPuzzle(nextId);
  };

  const handleRandomPuzzle = () => {
    const otherPuzzles = CHESS_PUZZLES.filter((p) => p.id !== puzzle.id);
    const randomOne = otherPuzzles[Math.floor(Math.random() * otherPuzzles.length)];
    navigateToPuzzle(randomOne.id);
  };

  const isAlreadySolved = solvedPuzzles.includes(puzzle.id);

  return (
    <View style={styles.container}>
      <AppHeader title="Tactics & Puzzles" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Top Stepper & Navigation */}
        <View style={styles.stepperRow}>
          <TouchableOpacity
            style={[styles.stepperBtn, puzzle.number === 1 && styles.stepperBtnDisabled]}
            disabled={puzzle.number === 1}
            onPress={() => {
              const prev = CHESS_PUZZLES.find((p) => p.number === puzzle.number - 1);
              if (prev) navigateToPuzzle(prev.id);
            }}
          >
            <Feather name="chevron-left" size={16} color={puzzle.number === 1 ? COLORS.border : COLORS.textHeading} />
            <Text style={[styles.stepperBtnText, puzzle.number === 1 && { color: COLORS.border }]}>Prev</Text>
          </TouchableOpacity>

          <View style={styles.puzzleCountBadge}>
            <Text style={styles.puzzleCountText}>
              Puzzle {puzzle.number} of {CHESS_PUZZLES.length}
            </Text>
            {isAlreadySolved && (
              <Feather name="check-circle" size={12} color={COLORS.progressFill} style={{ marginLeft: 4 }} />
            )}
          </View>

          <TouchableOpacity style={styles.randomBtn} onPress={handleRandomPuzzle}>
            <Text style={styles.randomBtnText}>🎲 Random</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.stepperBtn, puzzle.number === CHESS_PUZZLES.length && styles.stepperBtnDisabled]}
            disabled={puzzle.number === CHESS_PUZZLES.length}
            onPress={() => {
              const next = CHESS_PUZZLES.find((p) => p.number === puzzle.number + 1);
              if (next) navigateToPuzzle(next.id);
            }}
          >
            <Text style={[styles.stepperBtnText, puzzle.number === CHESS_PUZZLES.length && { color: COLORS.border }]}>Next</Text>
            <Feather name="chevron-right" size={16} color={puzzle.number === CHESS_PUZZLES.length ? COLORS.border : COLORS.textHeading} />
          </TouchableOpacity>
        </View>

        {/* Puzzle Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <View style={styles.themeBadgeRow}>
                <Text style={styles.themeBadge}>{puzzle.theme.toUpperCase()}</Text>
                <Text style={styles.xpBadge}>+{puzzle.xpReward} XP</Text>
              </View>
              <Text style={styles.puzzleTitle}>{puzzle.title}</Text>
              <Text style={styles.puzzleSubtitle}>{puzzle.subtitle}</Text>
            </View>

            <View style={styles.ratingBox}>
              <Text style={styles.ratingLabel}>RATING</Text>
              <Text style={styles.ratingVal}>{puzzle.rating}</Text>
            </View>
          </View>
        </View>

        {/* Coach One Live Speech Bubble */}
        <View style={styles.coachBubbleCard}>
          <View style={styles.coachAvatar}>
            <Text style={styles.coachInitial}>C1</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.coachTitle}>Coach One Tactical Radar:</Text>
            <Text style={styles.coachText}>&ldquo;{feedback}&rdquo;</Text>
          </View>
        </View>

        {/* Interactive Chessboard */}
        <View style={styles.boardCard}>
          <View style={styles.boardWrapper}>
            <Chessboard
              fen={fen}
              boardSize={320}
            />
          </View>

          {/* Interactive Choices */}
          <View style={styles.choicesSection}>
            <Text style={styles.choicesHeading}>SELECT THE WINNING MOVE:</Text>

            <View style={styles.choicesList}>
              {puzzle.choices.map((choice, idx) => {
                const isSelected = selectedChoice === idx;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.choiceBtn,
                      isSelected && status === 'wrong' && styles.choiceBtnWrong,
                      isSelected && status === 'success' && styles.choiceBtnCorrect,
                      status === 'success' && choice.isCorrect && styles.choiceBtnCorrect,
                    ]}
                    onPress={() => handleChoice(idx)}
                    disabled={status === 'success'}
                    activeOpacity={0.7}
                  >
                    <View style={styles.choiceLetterCircle}>
                      <Text style={styles.choiceLetterText}>{String.fromCharCode(65 + idx)}</Text>
                    </View>
                    <Text style={[styles.choiceLabel, isSelected && { fontWeight: '700' }]}>
                      {choice.label}
                    </Text>
                    {status === 'success' && choice.isCorrect && (
                      <Feather name="check" size={18} color={COLORS.progressFill} style={{ marginLeft: 'auto' }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Success Banner */}
          {status === 'success' && (
            <View style={styles.successBanner}>
              <Text style={{ fontSize: 24 }}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Puzzle Solved! Master Move!</Text>
                <Text style={styles.successDesc}>{puzzle.explanation}</Text>
                <Text style={styles.successXp}>+{puzzle.xpReward} XP earned · Quest progress recorded!</Text>
              </View>

              <TouchableOpacity style={styles.nextPuzzleBtn} onPress={handleNextPuzzle}>
                <Text style={styles.nextPuzzleBtnText}>Next Puzzle ›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Bottom Actions: Hint & Reset */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.hintActionBtn} onPress={handleHint}>
              <Feather name="help-circle" size={16} color={COLORS.primary} />
              <Text style={styles.hintActionText}>Ask Coach for a Hint</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resetActionBtn} onPress={handleReset}>
              <Feather name="rotate-ccw" size={15} color={COLORS.textBody} />
              <Text style={styles.resetActionText}>Reset Position</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 60, maxWidth: 550, alignSelf: 'center', width: '100%', gap: 14 },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  stepperBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F0F3EE',
  },
  stepperBtnDisabled: { opacity: 0.4 },
  stepperBtnText: { fontSize: 12, fontWeight: '700', color: COLORS.textHeading },
  puzzleCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  puzzleCountText: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  randomBtn: {
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  randomBtnText: { fontSize: 11, fontWeight: '700', color: '#92400E' },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  themeBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  themeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  xpBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  puzzleTitle: { fontSize: 18, fontWeight: FONTS.headingWeight, color: COLORS.textHeading },
  puzzleSubtitle: { fontSize: 12, color: COLORS.textBody, marginTop: 2 },
  ratingBox: {
    backgroundColor: '#F0F3EE',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  ratingLabel: { fontSize: 9, fontWeight: '800', color: COLORS.textBody, letterSpacing: 0.5 },
  ratingVal: { fontSize: 14, fontWeight: '800', color: COLORS.textHeading, marginTop: 1 },
  coachBubbleCard: {
    backgroundColor: '#FAF7F0',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    padding: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...SHADOWS.soft,
  },
  coachAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInitial: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  coachTitle: { fontSize: 11, fontWeight: '800', color: '#92400E' },
  coachText: { fontSize: 12, color: COLORS.textHeading, marginTop: 2, fontStyle: 'italic', lineHeight: 18 },
  boardCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    alignItems: 'center',
    gap: 14,
  },
  boardWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#244535',
  },
  choicesSection: { width: '100%', gap: 8 },
  choicesHeading: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  choicesList: { gap: 8 },
  choiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAF7',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 12,
    borderRadius: 12,
  },
  choiceBtnWrong: { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' },
  choiceBtnCorrect: { borderColor: COLORS.progressFill, backgroundColor: '#F0FFF4' },
  choiceLetterCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceLetterText: { fontSize: 11, fontWeight: '800', color: COLORS.textHeading },
  choiceLabel: { fontSize: 13, color: COLORS.textHeading, flex: 1, fontWeight: '600' },
  successBanner: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.progressFill,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  successTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  successDesc: { fontSize: 12, color: '#047857', lineHeight: 18 },
  successXp: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginTop: 2 },
  nextPuzzleBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nextPuzzleBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  bottomActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3EE',
  },
  hintActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hintActionText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  resetActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetActionText: { fontSize: 12, fontWeight: '600', color: COLORS.textBody },
});
