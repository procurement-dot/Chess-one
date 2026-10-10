import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../constants/chessone-theme';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    school: '',
    schoolClass: '',
    level: '',
    fideId: '',
    parentName: '',
    parentEmail: '',
    consent: false,
  });

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@chessone_onboardingDone', 'true');
    } catch (e) {}
    router.replace('/' as any);
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
    else completeOnboarding();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Getting to know you</Text>
        <TouchableOpacity onPress={completeOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressDots}>
          {[1, 2, 3].map(s => (
            <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
          ))}
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome! Tell us about yourself.</Text>
            
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. John Doe"
              value={formData.name}
              onChangeText={(t) => setFormData({...formData, name: t})}
            />

            <Text style={styles.label}>School</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Greenwood High"
              value={formData.school}
              onChangeText={(t) => setFormData({...formData, school: t})}
            />

            <Text style={styles.label}>Class / Grade</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 5th Grade"
              value={formData.schoolClass}
              onChangeText={(t) => setFormData({...formData, schoolClass: t})}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What's your chess level?</Text>
            
            <View style={styles.levelCards}>
              {['Beginner', 'Developing', 'Advanced'].map(lvl => (
                <TouchableOpacity 
                  key={lvl} 
                  style={[styles.levelCard, formData.level === lvl && styles.levelCardActive]}
                  onPress={() => setFormData({...formData, level: lvl})}
                >
                  <Text style={[styles.levelCardText, formData.level === lvl && styles.levelCardTextActive]}>{lvl}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>FIDE ID (Optional)</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. 12345678"
              value={formData.fideId}
              onChangeText={(t) => setFormData({...formData, fideId: t})}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Parent & Guardian details</Text>
            
            <Text style={styles.label}>Parent Name</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. Jane Doe"
              value={formData.parentName}
              onChangeText={(t) => setFormData({...formData, parentName: t})}
            />

            <Text style={styles.label}>Parent Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="e.g. jane@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.parentEmail}
              onChangeText={(t) => setFormData({...formData, parentEmail: t})}
            />

            <TouchableOpacity 
              style={styles.checkboxRow}
              onPress={() => setFormData({...formData, consent: !formData.consent})}
            >
              <View style={[styles.checkbox, formData.consent && styles.checkboxActive]}>
                {formData.consent && <Feather name="check" size={14} color={COLORS.white} />}
              </View>
              <Text style={styles.checkboxLabel}>I have my parent's consent to join ChessOne.</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={nextStep}>
          <Text style={styles.btnText}>
            {step === 3 ? 'Build my learning path' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', padding: 16, alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  skipText: { fontSize: 14, color: COLORS.textBody, fontWeight: '600' },
  content: { padding: 20 },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary },
  stepContainer: {},
  title: { fontSize: 26, fontWeight: FONTS.headingWeight, color: COLORS.textHeading, marginBottom: 32 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.textHeading, marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: COLORS.white, borderWidth: 1, borderColor: COLORS.border, borderRadius: SIZES.radiusButton, padding: 16, fontSize: 16, color: COLORS.textHeading },
  levelCards: { gap: 12, marginBottom: 16 },
  levelCard: { padding: 20, backgroundColor: COLORS.white, borderRadius: SIZES.radiusCard, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  levelCardActive: { backgroundColor: COLORS.hero, borderColor: COLORS.primary },
  levelCardText: { fontSize: 16, fontWeight: '600', color: COLORS.textHeading },
  levelCardTextActive: { color: COLORS.primary, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { flex: 1, fontSize: 14, color: COLORS.textBody, lineHeight: 20 },
  footer: { padding: 20, backgroundColor: COLORS.background },
  btn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: SIZES.radiusButton, alignItems: 'center' },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' }
});
