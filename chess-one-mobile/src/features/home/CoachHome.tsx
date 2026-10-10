import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { SAMPLE_COACH_DATA } from '../../data/homeData';

export const CoachHome = () => {
  const [showForm, setShowForm] = useState(false);
  const [formSaved, setFormSaved] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>COACH WORKSPACE</Text>
      <Text style={styles.greeting}>Your next star starts here.</Text>

      <TouchableOpacity style={styles.primaryBtn} onPress={() => setShowForm(!showForm)}>
        <Text style={styles.primaryBtnText}>{showForm ? 'Cancel' : 'Create a batch'}</Text>
      </TouchableOpacity>

      {showForm && !formSaved && (
        <View style={styles.whiteCard}>
          <Text style={styles.sectionTitle}>Create a live class batch</Text>
          <TextInput style={styles.input} placeholder="Batch Name" placeholderTextColor={COLORS.textBody} />
          <TextInput style={styles.input} placeholder="Level (1-5)" placeholderTextColor={COLORS.textBody} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Capacity" placeholderTextColor={COLORS.textBody} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Start Date" placeholderTextColor={COLORS.textBody} />
          <TextInput style={styles.input} placeholder="Time (IST)" placeholderTextColor={COLORS.textBody} />
          <TextInput style={styles.input} placeholder="Days" placeholderTextColor={COLORS.textBody} />
          <TextInput style={styles.input} placeholder="Sessions" placeholderTextColor={COLORS.textBody} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Fee ₹" placeholderTextColor={COLORS.textBody} keyboardType="numeric" />
          <TextInput style={styles.input} placeholder="Delivery Mode" placeholderTextColor={COLORS.textBody} />
          <TextInput style={styles.input} placeholder="Outcomes" placeholderTextColor={COLORS.textBody} multiline />
          
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 16 }]} onPress={() => setFormSaved(true)}>
            <Text style={styles.primaryBtnText}>Save Batch locally</Text>
          </TouchableOpacity>
        </View>
      )}

      {formSaved && (
        <View style={[styles.whiteCard, { backgroundColor: COLORS.hero }]}>
          <Text style={styles.taskTitle}>Batch created successfully!</Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Next live class</Text>
      <View style={[styles.whiteCard, { backgroundColor: COLORS.warmCream }]}>
        <Text style={styles.taskTitle}>{SAMPLE_COACH_DATA.nextClass.title}</Text>
        <Text style={styles.subtitle}>{SAMPLE_COACH_DATA.nextClass.time} · {SAMPLE_COACH_DATA.nextClass.students} students</Text>
      </View>

      <Text style={styles.sectionTitle}>Students worth celebrating</Text>
      {SAMPLE_COACH_DATA.celebrations.map((cel, idx) => (
        <View key={idx} style={styles.whiteCard}>
          <Text style={styles.subtitle}>{cel}</Text>
        </View>
      ))}

      <Text style={styles.sectionTitle}>Coaching levels</Text>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        {[1, 2, 3, 4, 5].map((lvl) => (
          <View key={lvl} style={styles.levelPill}>
            <Text style={styles.levelPillText}>Level {lvl}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 16 },
  eyebrow: { fontSize: SIZES.fontEyebrow, fontWeight: FONTS.eyebrowWeight, letterSpacing: FONTS.eyebrowSpacing, color: COLORS.textBody },
  greeting: { fontSize: SIZES.fontHeading, fontWeight: FONTS.headingWeight, color: COLORS.textHeading },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textHeading, marginTop: 8 },
  whiteCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, padding: 16, ...SHADOWS.soft, gap: 4 },
  taskTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  subtitle: { fontSize: 14, color: COLORS.textBody },
  primaryBtn: { backgroundColor: COLORS.primary, paddingVertical: 12, borderRadius: SIZES.radiusButton, alignItems: 'center' },
  primaryBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 15 },
  input: { borderBottomWidth: 1, borderBottomColor: COLORS.border, paddingVertical: 8, fontSize: 14, color: COLORS.textHeading, marginTop: 8 },
  levelPill: { backgroundColor: COLORS.hero, paddingHorizontal: 12, paddingVertical: 6, borderRadius: SIZES.radiusChip },
  levelPillText: { color: COLORS.primary, fontWeight: '700', fontSize: 12 },
});
