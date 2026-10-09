import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { learnStore } from '../../features/learn/learnStore';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function LevelScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const levelId = parseInt(id as string, 10) || 1;

  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success'>('idle');

  const handleHint = () => {
    setHintUsed(true);
    setStatus('idle');
  };

  const handleOption = (index: number) => {
    setSelectedOption(index);
    if (index === 1) { // 1 is correct for sample
      setStatus('success');
      const stars = hintUsed ? 2 : 3;
      learnStore.completeLevel(levelId, stars);
    } else {
      setStatus('wrong');
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader title={`Level ${levelId}`} showBack />
      
      <View style={styles.content}>
        <Text style={styles.eyebrow}>LEARN → TRY → GROW · +20 XP</Text>
        <Text style={styles.title}>The knight's move</Text>
        
        <View style={styles.whiteCard}>
          <Text style={styles.bodyText}>
            The knight moves in an 'L' shape: two squares in one direction and then one square at a right angle. 
            It is the only piece that can jump over other pieces!
          </Text>
        </View>
        
        <View style={styles.quizSection}>
          <Text style={styles.quizTitle}>Which piece can jump over others?</Text>
          
          {['The Bishop', 'The Knight', 'The Rook'].map((opt, idx) => (
            <TouchableOpacity 
              key={idx}
              style={[
                styles.optionBtn,
                selectedOption === idx && status === 'wrong' && { borderColor: '#E53E3E', backgroundColor: '#FFF5F5' },
                selectedOption === idx && status === 'success' && { borderColor: COLORS.progressFill, backgroundColor: '#F0FFF4' }
              ]}
              onPress={() => handleOption(idx)}
              disabled={status === 'success'}
            >
              <Text style={styles.optionText}>{opt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {status === 'wrong' && (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackText}>Not quite! Try again or ask Coach One.</Text>
            <TouchableOpacity onPress={handleHint}><Text style={styles.hintLink}>Ask Coach One for a hint</Text></TouchableOpacity>
          </View>
        )}

        {hintUsed && status !== 'success' && (
          <View style={[styles.feedbackCard, { backgroundColor: COLORS.hero }]}>
            <Text style={[styles.feedbackText, { color: COLORS.primary }]}>Coach One says: Think about horses jumping!</Text>
          </View>
        )}

        {status === 'success' && (
          <View style={[styles.feedbackCard, { backgroundColor: COLORS.progressFill, alignItems: 'center' }]}>
            <Text style={[styles.feedbackText, { color: COLORS.white, fontSize: 18, fontWeight: '800' }]}>Well done!</Text>
            <Text style={{ color: COLORS.white, marginTop: 4 }}>You earned {hintUsed ? 2 : 3} stars and +20 XP!</Text>
            <TouchableOpacity style={styles.nextBtn} onPress={() => router.back()}>
              <Text style={styles.nextBtnText}>Continue Journey</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, maxWidth: 700, alignSelf: 'center', width: '100%', gap: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.progressFill },
  title: { fontSize: 28, fontWeight: FONTS.headingWeight, color: COLORS.textHeading },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 20, ...SHADOWS.soft },
  bodyText: { fontSize: 16, color: COLORS.textBody, lineHeight: 24 },
  quizSection: { marginTop: 16, gap: 12 },
  quizTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginBottom: 8 },
  optionBtn: { padding: 16, borderRadius: SIZES.radiusButton, backgroundColor: COLORS.white, borderWidth: 2, borderColor: COLORS.border },
  optionText: { fontSize: 16, fontWeight: '600', color: COLORS.textHeading },
  feedbackCard: { padding: 16, borderRadius: SIZES.radiusCard, backgroundColor: '#FDE8E8', marginTop: 16, gap: 8 },
  feedbackText: { fontSize: 15, color: '#9B2C2C', fontWeight: '600' },
  hintLink: { fontSize: 14, color: COLORS.primary, fontWeight: '700', textDecorationLine: 'underline' },
  nextBtn: { backgroundColor: COLORS.white, paddingHorizontal: 20, paddingVertical: 10, borderRadius: SIZES.radiusButton, marginTop: 12 },
  nextBtnText: { color: COLORS.progressFill, fontWeight: '800' }
});
