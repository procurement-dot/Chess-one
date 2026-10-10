import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Chessboard } from '@og-nav/expo-chessboard';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../../constants/chessone-theme';

export default function ClassroomPreviewScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  // A simple sequence of FENs for a classroom example
  const fens = [
    'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    'rnbqkbnr/pp1ppppp/8/2p5/4P3/8/PPPP1PPP/RNBQKBNR w KQkq c6 0 2',
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Exit Class</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.eyebrow}>LIVE CLASSROOM</Text>
        <Text style={styles.title}>Sicilian Defense</Text>

        <View style={styles.boardContainer}>
          <Chessboard 
            fen={fens[step]} 
            boardSize={320} 
            colors={{
              dark: COLORS.boardDark,
              light: COLORS.boardLight
            }}
          />
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity 
            style={[styles.btn, step === 0 && styles.btnDisabled]} 
            disabled={step === 0}
            onPress={() => setStep(prev => prev - 1)}
          >
            <Feather name="arrow-left" size={20} color={step === 0 ? COLORS.textBody : COLORS.white} />
            <Text style={[styles.btnText, step === 0 && styles.btnTextDisabled]}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.btn, step === fens.length - 1 && styles.btnDisabled]} 
            disabled={step === fens.length - 1}
            onPress={() => setStep(prev => prev + 1)}
          >
            <Text style={[styles.btnText, step === fens.length - 1 && styles.btnTextDisabled]}>Next</Text>
            <Feather name="arrow-right" size={20} color={step === fens.length - 1 ? COLORS.textBody : COLORS.white} />
          </TouchableOpacity>
        </View>

        <View style={styles.interactionCard}>
          <Text style={styles.interactionTitle}>Class check · Your turn</Text>
          <Text style={styles.interactionBody}>What should Black play next in this position?</Text>
          <TouchableOpacity style={styles.askBtn}>
            <Text style={styles.askBtnText}>Ask class a question</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: COLORS.white },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  content: { padding: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 24 },
  boardContainer: { alignItems: 'center', marginBottom: 24, padding: 10, backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, ...SHADOWS.soft },
  controlsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  btn: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: SIZES.radiusButton, gap: 8 },
  btnDisabled: { backgroundColor: COLORS.border },
  btnText: { color: COLORS.white, fontWeight: 'bold' },
  btnTextDisabled: { color: COLORS.textBody },
  interactionCard: { backgroundColor: COLORS.hero, padding: 20, borderRadius: SIZES.radiusCard },
  interactionTitle: { fontSize: 16, fontWeight: 'bold', color: COLORS.primary, marginBottom: 8 },
  interactionBody: { fontSize: 14, color: COLORS.textHeading, marginBottom: 16 },
  askBtn: { backgroundColor: COLORS.white, paddingVertical: 10, borderRadius: SIZES.radiusButton, alignItems: 'center' },
  askBtnText: { color: COLORS.primary, fontWeight: 'bold' }
});
