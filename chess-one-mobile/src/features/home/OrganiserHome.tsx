import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_ORGANISER_CHECKLIST, SAMPLE_ORGANISER_BOARDS } from '../../data/homeData';
import { Feather } from '@expo/vector-icons';

export const OrganiserHome = () => {
  const [checklist, setChecklist] = useState(SAMPLE_ORGANISER_CHECKLIST);

  const toggleCheck = (id: string) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>ORGANISER WORKSPACE</Text>
      
      <Text style={styles.sectionTitle}>Tournament readiness {doneCount}/{checklist.length}</Text>
      <View style={styles.whiteCard}>
        {checklist.map((item, idx) => (
          <TouchableOpacity 
            key={item.id} 
            style={[styles.checkRow, idx < checklist.length - 1 && styles.borderBottom]}
            onPress={() => toggleCheck(item.id)}
          >
            <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
              {item.done && <Feather name="check" size={14} color={COLORS.white} />}
            </View>
            <Text style={[styles.subtitle, item.done && { textDecorationLine: 'line-through', color: COLORS.border }]}>
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Round control</Text>
      <View style={styles.whiteCard}>
        <View style={styles.boardHeader}>
          <Text style={styles.boardColTitle}>Board</Text>
          <Text style={styles.boardColTitle}>White vs Black</Text>
          <Text style={styles.boardColTitle}>Result</Text>
        </View>
        {SAMPLE_ORGANISER_BOARDS.map((b) => (
          <View key={b.id} style={styles.boardRow}>
            <Text style={styles.boardText}>{b.board}</Text>
            <Text style={[styles.boardText, { flex: 2 }]}>{b.white} - {b.black}</Text>
            <TouchableOpacity style={styles.resultBtn}>
              <Text style={styles.resultBtnText}>{b.result || 'Enter'}</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginTop: 8 },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft },
  subtitle: { fontSize: 15, color: COLORS.textHeading },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: COLORS.primary },
  boardHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingBottom: 8, marginBottom: 8 },
  boardColTitle: { flex: 1, fontSize: 12, fontWeight: '700', color: COLORS.textBody },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  boardText: { flex: 1, fontSize: 14, color: COLORS.textHeading, fontWeight: '500' },
  resultBtn: { flex: 1, backgroundColor: COLORS.hero, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  resultBtnText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
});
