import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_CLASSES } from '../../data/tournamentsData';
import { Feather } from '@expo/vector-icons';

const CHIPS = ['All', 'Beginner', 'Intermediate', 'Advanced'];

export default function ClassesScreen() {
  const [activeChip, setActiveChip] = useState('All');
  const [search, setSearch] = useState('');

  const filteredClasses = SAMPLE_CLASSES.filter(c => {
    if (activeChip !== 'All' && c.level !== activeChip) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <View style={styles.container}>
      <AppHeader title="Live Classes" subtitle="Learn with the best" />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={COLORS.textBody} />
          <TextInput 
            style={styles.searchInput}
            placeholder="Find your batch"
            placeholderTextColor={COLORS.textBody}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

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
        {filteredClasses.length === 0 ? (
          <Text style={styles.emptyText}>No classes found.</Text>
        ) : (
          filteredClasses.map(c => (
            <View key={c.id} style={styles.classCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.className}>{c.name}</Text>
                <View style={styles.badge}><Text style={styles.badgeText}>{c.level}</Text></View>
              </View>
              
              <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                  <Feather name="calendar" size={14} color={COLORS.textBody} />
                  <Text style={styles.detailText}>{c.schedule}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Feather name="users" size={14} color={COLORS.textBody} />
                  <Text style={[styles.detailText, { color: COLORS.accentPeach, fontWeight: '700' }]}>{c.slots} slots left</Text>
                </View>
              </View>

              <View style={styles.footerRow}>
                <Text style={styles.feeText}>{c.fee}</Text>
                <TouchableOpacity style={styles.joinBtn}>
                  <Text style={styles.joinBtnText}>Join Batch</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
      
      <AppFooter activeTab="classes" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  searchContainer: { backgroundColor: COLORS.white, paddingHorizontal: 16, paddingVertical: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.background, borderRadius: SIZES.radiusChip, paddingHorizontal: 12, paddingVertical: 8, gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: COLORS.textHeading },
  chipScrollWrapper: { backgroundColor: COLORS.white, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  chipScroll: { paddingHorizontal: 16, gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusChip, backgroundColor: COLORS.background },
  activeChip: { backgroundColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textBody },
  activeChipText: { color: COLORS.white },
  content: { padding: 16, paddingBottom: 80, maxWidth: 700, alignSelf: 'center', width: '100%', gap: 16 },
  emptyText: { textAlign: 'center', color: COLORS.textBody, marginTop: 40 },
  classCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, gap: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  className: { fontSize: 17, fontWeight: '700', color: COLORS.textHeading, flex: 1, marginRight: 8 },
  badge: { backgroundColor: COLORS.hero, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700', color: COLORS.primary, textTransform: 'uppercase' },
  detailsRow: { flexDirection: 'row', gap: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.textBody, fontWeight: '500' },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  feeText: { fontSize: 16, fontWeight: '800', color: COLORS.textHeading },
  joinBtn: { backgroundColor: COLORS.primary, paddingVertical: 10, paddingHorizontal: 20, borderRadius: SIZES.radiusButton },
  joinBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 14 },
});
