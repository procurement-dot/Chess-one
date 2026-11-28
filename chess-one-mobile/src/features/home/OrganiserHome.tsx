import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { DEMO_ORGANIZER_DATA } from '../../mock/schoolDemo';
import { Feather } from '@expo/vector-icons';
import { CreateTournamentModal } from '../../components/tournament/CreateTournamentModal';

export const OrganiserHome = () => {
  const router = useRouter();
  const [checklist, setChecklist] = useState(DEMO_ORGANIZER_DATA.checklist);
  const [activeTab, setActiveTab] = useState<'Overview' | 'Checklist' | 'Rounds'>('Overview');
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const toggleCheck = (id: number) => {
    setChecklist(prev => prev.map(c => c.id === id ? { ...c, done: !c.done } : c));
  };

  const doneCount = checklist.filter(c => c.done).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.eyebrow}>ORGANISER WORKSPACE</Text>
          <Text style={styles.heading}>Bring your school to the board.</Text>
          <Text style={styles.subheading}>Plan, run and wrap up an online or offline tournament.</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtn}
          activeOpacity={0.8}
          onPress={() => setCreateModalVisible(true)}
        >
          <Text style={styles.createBtnText}>Create tournament</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {(['Overview', 'Checklist', 'Rounds'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabBtnText, activeTab === tab && styles.tabBtnTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Sample entries</Text>
          <Text style={styles.statValue}>{DEMO_ORGANIZER_DATA.sampleEntries}</Text>
          <Text style={styles.statSub}>From 8 schools</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Payments reconciled</Text>
          <Text style={styles.statValue}>{DEMO_ORGANIZER_DATA.paymentsReconciled}</Text>
          <Text style={[styles.statSub, { color: COLORS.progressFill, fontWeight: '700' }]}>4 pending</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Setup readiness</Text>
          <Text style={[styles.statValue, { color: '#C86848' }]}>{Math.round((doneCount / checklist.length) * 100)}%</Text>
          <Text style={styles.statSub}>{doneCount}/{checklist.length} done</Text>
        </View>
      </View>

      {/* Checklist section */}
      {(activeTab === 'Overview' || activeTab === 'Checklist') && (
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tournament readiness</Text>
            <Text style={styles.sectionCounter}>{doneCount}/{checklist.length}</Text>
          </View>
          {checklist.map((item, idx) => (
            <TouchableOpacity 
              key={item.id} 
              style={[styles.checkRow, idx < checklist.length - 1 && styles.borderBottom]}
              onPress={() => toggleCheck(item.id)}
            >
              <View style={[styles.checkbox, item.done && styles.checkboxDone]}>
                {item.done && <Feather name="check" size={12} color={COLORS.white} />}
              </View>
              <Text style={[styles.subtitle, item.done && { textDecorationLine: 'line-through', color: COLORS.textBody }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Rounds & Rooms section */}
      {(activeTab === 'Overview' || activeTab === 'Rounds') && (
        <View style={styles.whiteCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Round control</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Swiss · Round 1 of 5</Text>
            </View>
          </View>
          
          <View style={styles.boardHeader}>
            <Text style={styles.boardColTitle}>Board</Text>
            <Text style={[styles.boardColTitle, { flex: 2 }]}>Pairing</Text>
            <Text style={styles.boardColTitle}>Result</Text>
          </View>

          {DEMO_ORGANIZER_DATA.boards.map((b, idx) => (
            <View key={b.board} style={[styles.boardRow, idx < DEMO_ORGANIZER_DATA.boards.length - 1 && styles.borderBottom]}>
              <Text style={styles.boardText}>Board {b.board}</Text>
              <Text style={[styles.boardText, { flex: 2, fontWeight: '600' }]}>{b.white} vs {b.black}</Text>
              <TouchableOpacity style={styles.resultBtn}>
                <Text style={styles.resultBtnText}>{b.result || 'Enter'}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Create Tournament Modal */}
      <CreateTournamentModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={(tournamentId) => {
          setCreateModalVisible(false);
          router.push(`/tournaments/${tournamentId}` as any);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  headerRow: { gap: 10 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  heading: { fontSize: 22, fontWeight: '800', color: COLORS.textHeading },
  subheading: { fontSize: 13, color: COLORS.textBody, marginTop: 2 },
  createBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: SIZES.radiusButton,
    alignSelf: 'flex-start',
  },
  createBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    padding: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: COLORS.hero,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  tabBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  statsRow: { flexDirection: 'row', gap: 8 },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 12,
    ...SHADOWS.soft,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statLabel: { fontSize: 10, color: COLORS.textBody, fontWeight: '600', textAlign: 'center' },
  statValue: { fontSize: 16, fontWeight: '800', color: COLORS.primary, marginVertical: 2 },
  statSub: { fontSize: 9, color: COLORS.textBody, textAlign: 'center' },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, borderWidth: 1, borderColor: COLORS.border, gap: 10 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textHeading },
  sectionCounter: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  checkRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9, gap: 10 },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: COLORS.border },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: COLORS.border, justifyContent: 'center', alignItems: 'center' },
  checkboxDone: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  subtitle: { fontSize: 12, color: COLORS.textHeading, flex: 1 },
  badge: { backgroundColor: COLORS.hero, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { color: COLORS.primary, fontSize: 10, fontWeight: '800' },
  boardHeader: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  boardColTitle: { fontSize: 11, fontWeight: '700', color: COLORS.textBody },
  boardRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 9 },
  boardText: { fontSize: 12, color: COLORS.textHeading },
  resultBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 6 },
  resultBtnText: { color: COLORS.white, fontSize: 11, fontWeight: '700' },
});
