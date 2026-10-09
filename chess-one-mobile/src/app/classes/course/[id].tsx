import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../../constants/chessone-theme';

export default function CoursePreviewScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color={COLORS.primary} />
          <Text style={styles.backText}>Classes</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>BEGINNER BATCH</Text>
          <Text style={styles.title}>Chess Fundamentals</Text>
          <Text style={styles.subtitle}>8 Sessions • Starts next Monday</Text>
        </View>

        <Text style={styles.sectionTitle}>What you'll learn</Text>
        <View style={styles.card}>
          <Text style={styles.listItem}>• Piece movements and values</Text>
          <Text style={styles.listItem}>• Basic checkmate patterns</Text>
          <Text style={styles.listItem}>• Opening principles</Text>
        </View>

        <Text style={styles.sectionTitle}>Before you enrol</Text>
        <Text style={styles.bodyText}>
          Make sure you have a stable internet connection. No prior chess knowledge is required!
        </Text>

      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceCol}>
          <Text style={styles.priceLabel}>Course Fee</Text>
          <Text style={styles.priceValue}>₹999</Text>
        </View>
        <TouchableOpacity style={styles.buyBtn} onPress={() => {
          alert('Demo Payment Confirmation');
          router.back();
        }}>
          <Text style={styles.buyBtnText}>Buy Course</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', backgroundColor: COLORS.white },
  backBtn: { flexDirection: 'row', alignItems: 'center' },
  backText: { fontSize: 16, color: COLORS.primary, fontWeight: '600' },
  content: { padding: 16, paddingBottom: 100 },
  heroCard: { backgroundColor: COLORS.warmCream, borderRadius: SIZES.radiusCard, padding: 20, marginBottom: 24, ...SHADOWS.soft },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.primary, marginBottom: 8 },
  title: { fontSize: 24, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 8 },
  subtitle: { fontSize: 14, color: COLORS.textBody },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginBottom: 12, marginTop: 8 },
  card: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, gap: 12, marginBottom: 24 },
  listItem: { fontSize: 15, color: COLORS.textBody, fontWeight: '500' },
  bodyText: { fontSize: 15, color: COLORS.textBody, lineHeight: 22 },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.border, alignItems: 'center', justifyContent: 'space-between' },
  priceCol: {},
  priceLabel: { fontSize: 12, color: COLORS.textBody },
  priceValue: { fontSize: 20, fontWeight: 'bold', color: COLORS.textHeading },
  buyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: SIZES.radiusButton },
  buyBtnText: { color: COLORS.white, fontWeight: 'bold', fontSize: 16 },
});
