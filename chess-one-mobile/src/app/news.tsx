import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';

export default function NewsScreen() {
  const router = useRouter();
  const [activeChip, setActiveChip] = useState('All');
  
  const chips = ['All', 'Chess', 'Sports', 'Competitions', 'Workshops'];

  const newsItems = [
    { id: 1, type: 'News', title: 'Grandmaster Clash in Mumbai', date: '2 hrs ago', tag: 'Chess' },
    { id: 2, type: 'Workshop', title: 'Mastering the Endgame', date: 'Oct 15', tag: 'Workshops' },
    { id: 3, type: 'Update', title: 'ChessOne reaches 10,000 students', date: '1 day ago', tag: 'Sports' }
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>There's a world beyond the board.</Text>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
          {chips.map(chip => (
            <TouchableOpacity 
              key={chip} 
              style={[styles.chip, activeChip === chip && styles.chipActive]}
              onPress={() => setActiveChip(chip)}
            >
              <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {newsItems.filter(n => activeChip === 'All' || n.tag === activeChip).map(item => (
            <TouchableOpacity key={item.id} style={styles.card}>
              <View style={styles.cardImagePlaceholder}>
                <Feather name="image" size={32} color={COLORS.border} />
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.eyebrow}>{item.type.toUpperCase()}</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDate}>{item.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.white },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textHeading },
  content: { padding: 16, paddingBottom: 60 },
  title: { fontSize: 28, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 20 },
  chipsScroll: { flexDirection: 'row', marginBottom: 24, paddingBottom: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: SIZES.radiusChip, backgroundColor: COLORS.white, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { fontSize: 14, fontWeight: '600', color: COLORS.textBody },
  chipTextActive: { color: COLORS.white },
  list: { gap: 16 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, ...SHADOWS.soft, overflow: 'hidden' },
  cardImagePlaceholder: { height: 140, backgroundColor: COLORS.hero, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary, marginBottom: 6 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: COLORS.textHeading, marginBottom: 4 },
  cardDate: { fontSize: 13, color: COLORS.textBody }
});
