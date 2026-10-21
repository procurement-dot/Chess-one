import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { GAME_REVIEWS } from '../../data/learn';
import { learnStore } from '../../features/learn/learnStore';
import { Chess } from 'chess.js';
import Chessboard from '@og-nav/expo-chessboard';
import { Feather } from '@expo/vector-icons';

export default function GameReviewScreen() {
  const game = GAME_REVIEWS[0];
  const [chess] = useState(() => new Chess());
  const [step, setStep] = useState(0);
  const [fen, setFen] = useState(chess.fen());

  useEffect(() => {
    chess.reset();
    for (let i = 0; i < step; i++) {
      const moveObj = game.moves[i];
      if (moveObj) {
        try {
          chess.move(moveObj.san);
        } catch (e) {
          console.warn('Move replay error:', e);
        }
      }
    }
    setFen(chess.fen());

    // Record game review when student reaches the end
    if (step === game.moves.length) {
      learnStore.recordGameReview();
    }
  }, [step, chess, game]);

  const handleNext = () => {
    if (step < game.moves.length) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const handleReset = () => {
    setStep(0);
  };

  const currentMove = step > 0 ? game.moves[step - 1] : null;
  const isFinished = step === game.moves.length;

  return (
    <View style={styles.container}>
      <AppHeader title="Game Review" showBack />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Game Title & Principle Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.eyebrow}>HISTORIC OPENINGS · ANNOTATED</Text>
              <Text style={styles.gameTitle}>{game.title}</Text>
              <Text style={styles.gameSubtitle}>{game.subtitle}</Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {step === 0 ? 'Start' : `${step} / ${game.moves.length}`}
              </Text>
            </View>
          </View>
        </View>

        {/* Replay Chessboard */}
        <View style={styles.boardCard}>
          <View style={styles.boardWrapper}>
            <Chessboard
              fen={fen}
              boardSize={320}
            />
          </View>

          {/* Annotated Move Explanation */}
          <View style={styles.annotationCard}>
            <View style={styles.principleRow}>
              <Text style={styles.principleBadge}>
                {currentMove ? currentMove.principle : 'OPENING SETUP'}
              </Text>
              <Text style={styles.movePgnText}>
                {currentMove ? currentMove.pgn : 'Initial Board'}
              </Text>
            </View>

            <Text style={styles.noteText}>
              {currentMove ? currentMove.note : game.description}
            </Text>
          </View>

          {/* Navigation Controls */}
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlBtn, step === 0 && styles.controlBtnDisabled]}
              onPress={handlePrev}
              disabled={step === 0}
            >
              <Feather name="chevron-left" size={18} color={step === 0 ? COLORS.border : COLORS.textHeading} />
              <Text style={[styles.controlBtnText, step === 0 && { color: COLORS.border }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlBtn}
              onPress={handleReset}
            >
              <Feather name="rotate-ccw" size={16} color={COLORS.textHeading} />
              <Text style={styles.controlBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.controlBtn,
                styles.controlBtnPrimary,
                isFinished && styles.controlBtnDisabled,
              ]}
              onPress={handleNext}
              disabled={isFinished}
            >
              <Text style={styles.controlBtnPrimaryText}>Next Move</Text>
              <Feather name="chevron-right" size={18} color={COLORS.white} />
            </TouchableOpacity>
          </View>

          {/* Completion Celebration Card */}
          {isFinished && (
            <View style={styles.completedCard}>
              <Text style={styles.completedIcon}>🎉</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.completedTitle}>Game Review Complete!</Text>
                <Text style={styles.completedSub}>
                  You unlocked the "Game Analyst" badge and earned +25 XP!
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 60, maxWidth: 520, alignSelf: 'center', width: '100%', gap: 16 },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    fontSize: SIZES.fontEyebrow,
    fontWeight: FONTS.eyebrowWeight,
    letterSpacing: FONTS.eyebrowSpacing,
    color: COLORS.primary,
  },
  gameTitle: { fontSize: 20, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginTop: 2 },
  gameSubtitle: { fontSize: 12, color: COLORS.textBody, marginTop: 1 },
  stepBadge: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stepBadgeText: { fontSize: 11, fontWeight: '700', color: COLORS.primary },
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
  annotationCard: {
    width: '100%',
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  principleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  principleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  movePgnText: { fontSize: 16, fontWeight: '800', color: COLORS.textHeading },
  noteText: { fontSize: 13, color: COLORS.textBody, lineHeight: 20 },
  controlsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    paddingTop: 8,
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
    gap: 4,
  },
  controlBtnDisabled: { opacity: 0.4 },
  controlBtnText: { color: COLORS.textHeading, fontWeight: '700', fontSize: 13 },
  controlBtnPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  controlBtnPrimaryText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
  completedCard: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.progressFill,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  completedIcon: { fontSize: 24 },
  completedTitle: { fontSize: 13, fontWeight: '800', color: '#065F46' },
  completedSub: { fontSize: 11, color: '#047857', marginTop: 1 },
});
