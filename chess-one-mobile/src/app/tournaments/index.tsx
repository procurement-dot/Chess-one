import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { useRoleStore } from '../../features/roles/roleStore';
import { SAMPLE_TOURNAMENTS } from '../../data/tournamentsData';
import { Feather } from '@expo/vector-icons';

const CHIPS = ['Active', 'Upcoming', 'My Tournaments'];

export default function TournamentsScreen() {
  const role = useRoleStore();
  const [activeChip, setActiveChip] = useState('Upcoming');

  const filteredTournaments = SAMPLE_TOURNAMENTS.filter(t => {
    if (activeChip === 'My Tournaments') return false; // Sample logic
    return t.status === activeChip;
  });

  return (
    <View style={styles.container}>
      <AppHeader title="Tournaments" subtitle="Compete and shine" />
      
      <View style={styles.chipScrollWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {CHIPS.map(chip => (
            <TouchableOpacity 
              key={chip} 
              style={[styles.chip, activeChip === chip && styles.activeChip]}
              onPress={() => setActiveChip(chip)}
            >
              <Text style={[styles.chipText, activeChip === chip && styles.activeChipText]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {filteredTournaments.length === 0 ? (
          <Text style={styles.emptyText}>No tournaments found.</Text>
        ) : (
          filteredTournaments.map(t => (
            <View key={t.id} style={styles.tournamentCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.tournamentName}>{t.name}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{t.status}</Text></View>
              </View>
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Feather name="calendar" size={14} color={COLORS.textBody} />
                  <Text style={styles.detailText}>{t.date} · {t.time}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="users" size={14} color={COLORS.textBody} />
                  <Text style={styles.detailText}>{t.categories}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="list" size={14} color={COLORS.textBody} />
                  <Text style={styles.detailText}>{t.format}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="tag" size={14} color={COLORS.textBody} />
                  <Text style={styles.detailText}>Entry: {t.entryFee}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.viewBtn}>
                <Text style={styles.viewBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
      
      {(role === 'Organiser' || role === 'School') && (
        <TouchableOpacity style={styles.fab}>
          <Feather name="plus" size={24} color={COLORS.white} />
          <Text style={styles.fabText}>Organise</Text>
        </TouchableOpacity>
      )}
      
      <AppFooter activeTab="tournaments" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  chipScrollWrapper: { backgroundColor: COLORS.white, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chipScroll: { paddingHorizontal: 16, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusChip, backgroundColor: COLORS.background },
  activeChip: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textBody },
  activeChipText: { color: COLORS.white },
  content: { padding: 16, paddingBottom: 80, maxWidth: 700, alignSelf: 'center', width: '100%', gap: 16 },
  emptyText: { textAlign: 'center', color: COLORS.textBody, marginTop: 40 },
  tournamentCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tournamentName: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, flex: 1, marginRight: 8 },
  badge: { backgroundColor: COLORS.hero, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
  detailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  detailItem: { width: '45%', flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.textBody, fontWeight: '500' },
  viewBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: SIZES.radiusButton, alignItems: 'center', marginTop: 4 },
  viewBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
  fab: { position: 'absolute', bottom: 80, right: 16, backgroundColor: COLORS.accentPeach, flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 24, gap: 8, ...SHADOWS.soft },
  fabText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
});
