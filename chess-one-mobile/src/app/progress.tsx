import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';

export default function ProgressScreen() {
  const router = useRouter();

  // Fake chart data
  const chartBars = [40, 60, 30, 80, 50, 90]; 

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Progress</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Progress is more than a number.</Text>
        
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Learning Points (Last 6 weeks)</Text>
          <View style={styles.chartRow}>
            {chartBars.map((val, idx) => (
              <View key={idx} style={styles.barCol}>
                <View style={[styles.barTrack, { height: 120 }]}>
                  <View style={[
                    styles.barFill, 
                    { height: `${val}%` },
                    idx === chartBars.length - 1 && { backgroundColor: COLORS.primary }
                  ]} />
                </View>
                <Text style={styles.barLabel}>W{idx + 1}</Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your chess toolkit</Text>
        <View style={styles.card}>
          <SkillBar label="Piece movement" percent={86} />
          <SkillBar label="Board awareness" percent={68} />
          <SkillBar label="King safety" percent={54} />
          <SkillBar label="Tactics" percent={40} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const SkillBar = ({ label, percent }: { label: string, percent: number }) => (
  <View style={styles.skillContainer}>
    <View style={styles.skillHeader}>
      <Text style={styles.skillLabel}>{label}</Text>
      <Text style={styles.skillPercent}>{percent}%</Text>
    </View>
    <View style={styles.skillTrack}>
      <View style={[styles.skillFill, { width: `${percent}%` }]} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textHeading },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 24, lineHeight: 34 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 20, ...SHADOWS.soft, marginBottom: 24 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading, marginBottom: 20 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 150 },
  barCol: { alignItems: 'center', width: 30 },
  barTrack: { width: 12, backgroundColor: COLORS.progressTrack, borderRadius: 6, justifyContent: 'flex-end', overflow: 'hidden' },
  barFill: { width: '100%', backgroundColor: COLORS.progressFill, borderRadius: 6 },
  barLabel: { fontSize: 12, color: COLORS.textBody, marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textHeading, marginBottom: 16 },
  skillContainer: { marginBottom: 16 },
  skillHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  skillLabel: { fontSize: 14, fontWeight: '600', color: COLORS.textHeading },
  skillPercent: { fontSize: 14, color: COLORS.textBody, fontWeight: '700' },
  skillTrack: { height: 8, backgroundColor: COLORS.progressTrack, borderRadius: 4, overflow: 'hidden' },
  skillFill: { height: '100%', backgroundColor: COLORS.progressFill, borderRadius: 4 },
});
