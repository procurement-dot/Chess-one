import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useLearnStore, learnStore } from '../../features/learn/learnStore';
import { COACH_DIALOGUES, getCoachReply } from '../../data/learn';
import { Chess } from 'chess.js';
import Chessboard from '@og-nav/expo-chessboard';
import { Feather } from '@expo/vector-icons';

const QUICK_OPENING_MOVES = [
  { san: 'e4', label: '1. e4 (King’s Pawn)' },
  { san: 'd4', label: '1. d4 (Queen’s Pawn)' },
  { san: 'Nf3', label: '1. Nf3 (Knight)' },
];

export default function PracticeScreen() {
  const { coachPersonality } = useLearnStore();
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [feedback, setFeedback] = useState(COACH_DIALOGUES[coachPersonality].initialGreeting);
  const [moveCount, setMoveCount] = useState(0);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // Update greeting if personality toggles and game is untouched
  useEffect(() => {
    if (moveCount === 0) {
      setFeedback(COACH_DIALOGUES[coachPersonality].initialGreeting);
    }
  }, [coachPersonality, moveCount]);

  const executeMove = (moveInput: string | { from: string; to: string; promotion?: string }) => {
    try {
      const result = chess.move(moveInput as any);
      if (result) {
        setFen(chess.fen());
        const newCount = moveCount + 1;
        setMoveCount(newCount);

        // Mark coach practice quest completed in learnStore!
        learnStore.recordCoachPractice();

        // Coach speaks!
        const reply = getCoachReply(coachPersonality, result.san, newCount);
        setFeedback(reply);

        // Opponent / AI automatic response
        if (!chess.isGameOver()) {
          setIsAiThinking(true);
          setTimeout(() => {
            try {
              const moves = chess.moves({ verbose: true });
              if (moves.length > 0) {
                const randomMove = moves[Math.floor(Math.random() * moves.length)];
                chess.move(randomMove);
                setFen(chess.fen());
              }
            } catch (err) {
              console.warn('AI move error:', err);
            } finally {
              setIsAiThinking(false);
            }
          }, 600);
        } else {
          setFeedback(chess.isCheckmate() ? "Checkmate! Incredible game!" : "Game Over! Draw!");
        }
      }
    } catch (e) {
      // invalid move attempted
    }
  };

  const handleBoardMove = (moveInfo: any) => {
    // expo-chessboard passes { move: { from, to } } or { from, to }
    const m = moveInfo?.move || moveInfo;
    if (m && m.from && m.to) {
      executeMove({ from: m.from, to: m.to, promotion: 'q' });
    }
  };

  const handleUndo = () => {
    chess.undo(); // Undo AI move
    chess.undo(); // Undo student move
    setFen(chess.fen());
    setFeedback(COACH_DIALOGUES[coachPersonality].undoReaction);
  };

  const handleReset = () => {
    chess.reset();
    setFen(chess.fen());
    setMoveCount(0);
    setIsAiThinking(false);
    setFeedback(COACH_DIALOGUES[coachPersonality].resetReaction);
  };

  const handleHint = () => {
    try {
      const moves = chess.moves({ verbose: true });
      if (moves.length > 0) {
        // Recommend a central or developing move if available
        const preferred = moves.find(m => ['e4', 'd4', 'Nf3', 'Nc3', 'Bc4', 'Nf6', 'd5', 'e5'].includes(m.san)) || moves[0];
        setFeedback(`Coach One Hint: Consider playing ${preferred.san} to develop your position!`);
      }
    } catch {
      setFeedback("Look for moves that control the central 4 squares!");
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Coach One Practice" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Coach Companion Header & Personality Selector */}
        <View style={styles.coachCard}>
          <View style={styles.coachTopRow}>
            <View style={styles.coachProfile}>
              <View style={styles.coachAvatar}>
                <Text style={styles.coachInitial}>C1</Text>
              </View>
              <View>
                <Text style={styles.coachName}>Coach One</Text>
                <Text style={styles.coachRole}>Live Dialogue Companion</Text>
              </View>
            </View>

            {/* Playful / Calm Toggle */}
            <View style={styles.moodToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.moodBtn,
                  coachPersonality === 'Playful' && styles.moodBtnActive,
                ]}
                onPress={() => learnStore.setCoachPersonality('Playful')}
              >
                <Text
                  style={[
                    styles.moodBtnText,
                    coachPersonality === 'Playful' && styles.moodBtnTextActive,
                  ]}
                >
                  Playful
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.moodBtn,
                  coachPersonality === 'Calm' && styles.moodBtnActive,
                ]}
                onPress={() => learnStore.setCoachPersonality('Calm')}
              >
                <Text
                  style={[
                    styles.moodBtnText,
                    coachPersonality === 'Calm' && styles.moodBtnTextActive,
                  ]}
                >
                  Calm
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Coach Speech Bubble */}
          <View style={styles.speechBubble}>
            <Text style={styles.speechText}>&ldquo;{feedback}&rdquo;</Text>
            {isAiThinking && (
              <Text style={styles.thinkingText}>Coach is analyzing the reply...</Text>
            )}
          </View>
        </View>

        {/* Practice Chessboard */}
        <View style={styles.boardCard}>
          <View style={styles.boardWrapper}>
            <Chessboard
              fen={fen}
              boardSize={320}
              onMove={handleBoardMove}
            />
          </View>

          {/* Quick Opening Move Chips */}
          {moveCount === 0 && (
            <View style={styles.quickMovesSection}>
              <Text style={styles.quickMovesTitle}>QUICK OPENING LAUNCHERS:</Text>
              <View style={styles.quickButtonsRow}>
                {QUICK_OPENING_MOVES.map((item) => (
                  <TouchableOpacity
                    key={item.san}
                    style={styles.quickMoveBtn}
                    onPress={() => executeMove(item.san)}
                  >
                    <Text style={styles.quickMoveBtnText}>{item.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Controls: Undo, Reset, Hint */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlBtn, moveCount === 0 && { opacity: 0.5 }]}
              onPress={handleUndo}
              disabled={moveCount === 0}
            >
              <Feather name="rotate-ccw" size={16} color={COLORS.textHeading} />
              <Text style={styles.controlBtnText}>Undo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
              <Feather name="refresh-cw" size={16} color="#DC2626" />
              <Text style={[styles.controlBtnText, { color: '#DC2626' }]}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlBtn, { backgroundColor: COLORS.primary }]}
              onPress={handleHint}
            >
              <Feather name="help-circle" size={16} color={COLORS.white} />
              <Text style={[styles.controlBtnText, { color: COLORS.white }]}>Hint</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 60, maxWidth: 520, alignSelf: 'center', width: '100%', gap: 16 },
  coachCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    gap: 12,
  },
  coachTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  coachProfile: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  coachAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  coachInitial: { color: COLORS.white, fontWeight: '800', fontSize: 16 },
  coachName: { fontSize: 15, fontWeight: '700', color: COLORS.textHeading },
  coachRole: { fontSize: 11, color: COLORS.textBody },
  moodToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F3EE',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  moodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  moodBtnActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  moodBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  moodBtnTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  speechBubble: {
    backgroundColor: '#FAF7F0',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
  },
  speechText: {
    fontSize: 13,
    color: COLORS.textHeading,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  thinkingText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 4,
  },
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
  quickMovesSection: {
    width: '100%',
    gap: 6,
    marginTop: 4,
  },
  quickMovesTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.primary,
  },
  quickButtonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickMoveBtn: {
    backgroundColor: '#F0F3EE',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  quickMoveBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F0F3EE',
  },
  controlBtn: {
    flex: 1,
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  controlBtnText: {
    color: COLORS.textHeading,
    fontWeight: '700',
    fontSize: 13,
  },
});
