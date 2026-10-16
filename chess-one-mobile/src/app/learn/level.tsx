import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { learnStore, useLearnStore } from '../../features/learn/learnStore';
import { getLevelById, getNextLevelId, LEARN_LEVELS } from '../../data/learn';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function LevelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const levelId = parseInt(id as string, 10) || 1;

  // Retrieve level data from decoupled data store
  const level = getLevelById(levelId) || LEARN_LEVELS[0];
  const nextLevelId = getNextLevelId(level.id);

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success'>('idle');

  const handleHint = () => {
    setHintUsed(true);
    setStatus('idle');
  };

  const handleOption = (index: number) => {
    setSelectedOption(index);
    if (index === level.quiz.correctIndex) {
      setStatus('success');
      const stars = hintUsed ? 2 : 3;
      learnStore.completeLevel(level.id, stars, level.xpReward);
    } else {
      setStatus('wrong');
    }
  };

  const handleNextLevel = () => {
    if (nextLevelId) {
      setSelectedOption(null);
      setHintUsed(false);
      setStatus('idle');
      router.replace(`/learn/level?id=${nextLevelId}` as any);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={`Level ${level.id}`} showBack />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBox}>
          <Text style={styles.eyebrow}>{level.eyebrow}</Text>
          <View style={styles.titleRow}>
            <Text style={styles.pieceIcon}>{level.pieceSymbol}</Text>
            <Text style={styles.title}>{level.title}</Text>
          </View>
        </View>

        {/* Lesson Rule Card */}
        <View style={styles.whiteCard}>
          <View style={styles.ruleHeaderRow}>
            <Text style={styles.ruleBadge}>LESSON</Text>
            <Text style={styles.ruleTitle}>{level.ruleTitle}</Text>
          </View>
          <Text style={styles.bodyText}>{level.ruleDescription}</Text>
        </View>

        {/* Quiz Section */}
        <View style={styles.quizCard}>
          <Text style={styles.quizLabel}>CHECK YOUR UNDERSTANDING</Text>
          <Text style={styles.quizTitle}>{level.quiz.question}</Text>

          <View style={styles.optionsList}>
            {level.quiz.options.map((opt, idx) => {
              const isSelected = selectedOption === idx;
              const isCorrect = idx === level.quiz.correctIndex;

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.optionBtn,
                    isSelected && status === 'wrong' && styles.optionWrong,
                    isSelected && status === 'success' && styles.optionSuccess,
                    status === 'success' && isCorrect && styles.optionSuccess,
                  ]}
                  onPress={() => handleOption(idx)}
                  disabled={status === 'success'}
                  activeOpacity={0.7}
                >
                  <View style={styles.optionCircle}>
                    <Text style={styles.optionLetter}>
                      {String.fromCharCode(65 + idx)}
                    </Text>
                  </View>
                  <Text style={[styles.optionText, isSelected && { fontWeight: '700' }]}>{opt}</Text>
                  {status === 'success' && isCorrect && (
                    <Feather name="check-circle" size={20} color={COLORS.progressFill} style={{ marginLeft: 'auto' }} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Wrong Answer Feedback */}
          {status === 'wrong' && (
            <View style={styles.feedbackCardWrong}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Feather name="alert-circle" size={18} color="#9B2C2C" />
                <Text style={styles.feedbackTextWrong}>Not quite! Try again or ask Coach One.</Text>
              </View>
              {!hintUsed && (
                <TouchableOpacity onPress={handleHint} style={styles.hintBtn}>
                  <Text style={styles.hintLink}>💡 Ask Coach One for a hint</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Coach One Hint Card */}
          {hintUsed && status !== 'success' && (
            <View style={styles.coachHintCard}>
              <View style={styles.coachAvatarMini}>
                <Text style={styles.coachInitialMini}>C1</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.coachHintTitle}>Coach One Hint:</Text>
                <Text style={styles.coachHintText}>{level.quiz.coachHint}</Text>
              </View>
            </View>
          )}

          {/* Success Card */}
          {status === 'success' && (
            <View style={styles.successCard}>
              <View style={styles.starsRewardRow}>
                {[1, 2, 3].map((s) => (
                  <Text key={s} style={{ fontSize: 24 }}>
                    {s <= (hintUsed ? 2 : 3) ? '⭐' : '☆'}
                  </Text>
                ))}
              </View>
              <Text style={styles.successTitle}>Well Done! Correct!</Text>
              <Text style={styles.successSub}>
                You earned {hintUsed ? '2' : '3'} Stars and +{level.xpReward} XP!
              </Text>
              <Text style={styles.explanationText}>{level.quiz.explanation}</Text>

              <View style={styles.actionButtonsRow}>
                <TouchableOpacity style={styles.continueBtn} onPress={() => router.back()}>
                  <Text style={styles.continueBtnText}>Journey Path</Text>
                </TouchableOpacity>

                {nextLevelId && (
                  <TouchableOpacity style={styles.nextLevelBtn} onPress={handleNextLevel}>
                    <Text style={styles.nextLevelBtnText}>Next Level ›</Text>
                  </TouchableOpacity>
                )}
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
  content: { padding: 16, paddingBottom: 60, maxWidth: 650, alignSelf: 'center', width: '100%', gap: 16 },
  headerBox: { gap: 4 },
  eyebrow: {
    fontSize: SIZES.fontEyebrow,
    fontWeight: FONTS.eyebrowWeight,
    letterSpacing: FONTS.eyebrowSpacing,
    color: COLORS.primary,
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pieceIcon: { fontSize: 28 },
  title: { fontSize: 24, fontWeight: FONTS.headingWeight, color: COLORS.textHeading },
  whiteCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    ...SHADOWS.soft,
    gap: 10,
  },
  ruleHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    letterSpacing: 0.5,
  },
  ruleTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  bodyText: { fontSize: 14, color: COLORS.textBody, lineHeight: 22 },
  quizCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 18,
    ...SHADOWS.soft,
    gap: 14,
  },
  quizLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: COLORS.primary,
  },
  quizTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading, lineHeight: 22 },
  optionsList: { gap: 10 },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAF7',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  optionWrong: { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' },
  optionSuccess: { borderColor: COLORS.progressFill, backgroundColor: '#F0FFF4' },
  optionCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionLetter: { fontSize: 12, fontWeight: '700', color: COLORS.textHeading },
  optionText: { fontSize: 14, color: COLORS.textHeading, flex: 1 },
  feedbackCardWrong: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FED7D7',
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  feedbackTextWrong: { fontSize: 13, color: '#9B2C2C', fontWeight: '600' },
  hintBtn: { alignSelf: 'flex-start', marginTop: 2 },
  hintLink: { fontSize: 13, color: COLORS.primary, fontWeight: '700' },
  coachHintCard: {
    backgroundColor: '#FAF7F0',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  coachAvatarMini: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coachInitialMini: { color: COLORS.white, fontWeight: '800', fontSize: 14 },
  coachHintTitle: { fontSize: 11, fontWeight: '800', color: COLORS.primary },
  coachHintText: { fontSize: 13, color: COLORS.textHeading, marginTop: 2 },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: COLORS.progressFill,
    padding: 18,
    borderRadius: 14,
    alignItems: 'center',
    gap: 8,
  },
  starsRewardRow: { flexDirection: 'row', gap: 4 },
  successTitle: { fontSize: 18, fontWeight: '800', color: '#065F46' },
  successSub: { fontSize: 13, fontWeight: '600', color: '#047857' },
  explanationText: {
    fontSize: 12,
    color: '#065F46',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 4,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    width: '100%',
  },
  continueBtn: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.progressFill,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  continueBtnText: { color: COLORS.progressFill, fontWeight: '700', fontSize: 13 },
  nextLevelBtn: {
    flex: 1,
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  nextLevelBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 13 },
});
