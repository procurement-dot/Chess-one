import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { Chess } from 'chess.js';
import Chessboard from '@og-nav/expo-chessboard';

const ANNOTATED_MOVES = [
  { pgn: '1. e4', note: 'Controlling the center and opening lines for the bishop and queen.' },
  { pgn: '1... e5', note: 'Black responds by challenging the center.' },
  { pgn: '2. Nf3', note: 'Developing a piece and attacking the e5 pawn.' },
  { pgn: '2... Nc6', note: 'Black defends the pawn while developing.' },
  { pgn: '3. Bc4', note: 'The Italian Game. Eyeing the weak f7 pawn.' },
];

export default function GameReviewScreen() {
  const [chess] = useState(new Chess());
  const [step, setStep] = useState(0);
  const [fen, setFen] = useState(chess.fen());

  useEffect(() => {
    chess.reset();
    for (let i = 0; i < step; i++) {
      const parts = ANNOTATED_MOVES[i].pgn.split(' ');
      const moveStr = parts.length > 1 ? parts[1] : parts[0];
      chess.move(moveStr);
    }
    setFen(chess.fen());
  }, [step, chess]);

  const handleNext = () => {
    if (step < ANNOTATED_MOVES.length) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Why did that move work?" showBack />
      
      <View style={styles.content}>
        <View style={styles.boardContainer}>
          <Chessboard 
            fen={fen} 
            boardSize={320}
          />
        </View>

        <View style={styles.whiteCard}>
          <Text style={styles.eyebrow}>
            {step === 0 ? 'STARTING POSITION' : `MOVE ${Math.ceil(step / 2)}`}
          </Text>
          <Text style={styles.title}>
            {step === 0 ? 'The Italian Game' : ANNOTATED_MOVES[step - 1].pgn}
          </Text>
          <Text style={styles.bodyText}>
            {step === 0 ? "Let's explore one of the oldest and most popular chess openings." : ANNOTATED_MOVES[step - 1].note}
          </Text>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={[styles.controlBtn, step === 0 && { opacity: 0.5 }]} onPress={handlePrev} disabled={step === 0}>
            <Text style={styles.controlBtnText}>Previous</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: COLORS.primary }, step === ANNOTATED_MOVES.length && { opacity: 0.5 }]} onPress={handleNext} disabled={step === ANNOTATED_MOVES.length}>
            <Text style={[styles.controlBtnText, { color: COLORS.white }]}>Next Move</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, maxWidth: 500, alignSelf: 'center', width: '100%', gap: 20 },
  boardContainer: { borderRadius: 8, overflow: 'hidden', ...SHADOWS.soft },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 20, ...SHADOWS.soft },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary, marginBottom: 4 },
  title: { fontSize: 22, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 8 },
  bodyText: { fontSize: 16, color: COLORS.textBody, lineHeight: 24 },
  controlsRow: { flexDirection: 'row', gap: 10 },
  controlBtn: { flex: 1, backgroundColor: COLORS.white, paddingVertical: 14, borderRadius: SIZES.radiusButton, alignItems: 'center', ...SHADOWS.soft },
  controlBtnText: { color: COLORS.textHeading, fontWeight: '700', fontSize: 15 },
});
