import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useLearnStore } from '../../features/learn/learnStore';
import { Chess, Move } from 'chess.js';
import Chessboard from '@og-nav/expo-chessboard';

const COACH_REPLIES = [
  "Great opening! Taking control of the center.",
  "Developing the knight, very solid.",
  "Ah, preparing to castle I see.",
  "Keeping the pressure on!",
];

export default function PracticeScreen() {
  const { coachPersonality } = useLearnStore();
  const [chess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [feedback, setFeedback] = useState("Your cheeky chess companion. Quick jokes. Patient hints. Make a move!");
  const [moveCount, setMoveCount] = useState(0);

  const handleMove = (moveInfo: any) => {
    try {
      // expo-chessboard might pass { from, to } directly or inside { move }
      const moveParams = moveInfo.move ? moveInfo.move : moveInfo;
      const result = chess.move(moveParams);
      if (result) {
        setFen(chess.fen());
        setMoveCount(prev => prev + 1);
        
        // Coach replies
        const reply = COACH_REPLIES[moveCount % COACH_REPLIES.length];
        setFeedback(coachPersonality === 'Playful' ? `Haha, ${reply.toLowerCase()} Nice one!` : reply);
        
        // Auto-reply for practice
        setTimeout(() => {
          if (!chess.isGameOver()) {
            const moves = chess.moves({ verbose: true });
            const randomMove = moves[Math.floor(Math.random() * moves.length)];
            chess.move(randomMove);
            setFen(chess.fen());
          }
        }, 600);
      }
    } catch (e) {
      // invalid move
    }
  };

  const handleUndo = () => {
    chess.undo(); // undo AI
    chess.undo(); // undo player
    setFen(chess.fen());
    setFeedback("Let's try that again!");
  };

  const handleReset = () => {
    chess.reset();
    setFen(chess.fen());
    setMoveCount(0);
    setFeedback("New game, fresh start!");
  };

  return (
    <View style={styles.container}>
      <AppHeader title="Coach One Practice" showBack />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.coachCard}>
          <View style={styles.coachAvatar}><Text style={styles.coachInitial}>C1</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={styles.taskTitle}>Coach One ({coachPersonality})</Text>
            <Text style={styles.subtitle}>{feedback}</Text>
          </View>
        </View>

        <View style={styles.boardContainer}>
          <Chessboard 
            fen={fen} 
            boardSize={320}
            onMove={handleMove}
          />
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity style={styles.controlBtn} onPress={handleUndo}>
            <Text style={styles.controlBtnText}>Undo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.controlBtn} onPress={handleReset}>
            <Text style={styles.controlBtnText}>New Practice</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.controlBtn, { backgroundColor: COLORS.primary }]}>
            <Text style={[styles.controlBtnText, { color: COLORS.white }]}>Hint</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, maxWidth: 500, alignSelf: 'center', width: '100%', gap: 20 },
  coachCard: { backgroundColor: COLORS.hero, borderRadius: SIZES.radiusCard, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16 },
  coachAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  coachInitial: { color: COLORS.white, fontWeight: '800', fontSize: 18 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 14, color: COLORS.textBody, marginTop: 4 },
  boardContainer: { borderRadius: 8, overflow: 'hidden', ...SHADOWS.soft },
  controlsRow: { flexDirection: 'row', gap: 10 },
  controlBtn: { flex: 1, backgroundColor: COLORS.white, paddingVertical: 12, borderRadius: SIZES.radiusButton, alignItems: 'center', ...SHADOWS.soft },
  controlBtnText: { color: COLORS.textHeading, fontWeight: '700', fontSize: 14 },
});
