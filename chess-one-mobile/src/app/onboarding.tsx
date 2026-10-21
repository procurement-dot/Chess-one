import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS } from '../constants/chessone-theme';
import { updateMyProfile } from '../services/user.service';
import { authStore } from '../store/authStore';
import { roleStore } from '../features/roles/roleStore';

export default function OnboardingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    role: 'STUDENT' as 'STUDENT' | 'PARENT',
    school: '',
    schoolClass: '',
    level: '' as 'Beginner' | 'Developing' | 'Advanced' | '',
    fideId: '',
    parentName: '',
    parentEmail: '',
    consent: false,
  });

  const completeOnboarding = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const updated = await updateMyProfile({
        name: formData.name.trim() || undefined,
        school: formData.school.trim() || undefined,
        schoolClass: formData.schoolClass.trim() || undefined,
        level: (formData.level as 'Beginner' | 'Developing' | 'Advanced') || undefined,
        fideId: formData.fideId.trim() || undefined,
        parentName: formData.parentName.trim() || undefined,
        parentEmail: formData.parentEmail.trim() || undefined,
        role: formData.role,
      });

      await AsyncStorage.setItem('@chessone_onboardingDone', 'true');
      authStore.updateUser({
        onboardingDone: true,
        role: updated.role,
        rating: updated.rating,
        gamesPlayed: updated.gamesPlayed,
      });
      roleStore.syncFromServer(updated.role);
      router.replace('/');
    } catch (err: unknown) {
      const errObj = err as { userFriendlyMessage?: string; message?: string };
      const msg = errObj?.userFriendlyMessage || errObj?.message || 'Failed to save profile. Please try again.';
      setErrorMsg(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleSkip = async () => {
    if (saving) return;
    try {
      setSaving(true);
      setErrorMsg(null);
      const updated = await updateMyProfile({ role: 'STUDENT' });
      await AsyncStorage.setItem('@chessone_onboardingDone', 'true');
      authStore.updateUser({
        onboardingDone: true,
        role: updated.role,
        rating: updated.rating,
        gamesPlayed: updated.gamesPlayed,
      });
      roleStore.syncFromServer(updated.role);
      router.replace('/');
    } catch {
      await AsyncStorage.setItem('@chessone_onboardingDone', 'true');
      authStore.updateUser({ onboardingDone: true });
      router.replace('/');
    } finally {
      setSaving(false);
    }
  };

  const nextStep = () => {
    setErrorMsg(null);
    if (step < 3) {
      setStep(step + 1);
    } else {
      if (formData.parentEmail.trim() && !/\S+@\S+\.\S+/.test(formData.parentEmail.trim())) {
        setErrorMsg('Please enter a valid email address');
        return;
      }
      completeOnboarding();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Getting to know you</Text>
        <TouchableOpacity onPress={handleSkip} disabled={saving}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.progressDots}>
          {[1, 2, 3].map((s) => (
            <View key={s} style={[styles.dot, step >= s && styles.dotActive]} />
          ))}
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color="#A32D2D" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>Welcome! Tell us about yourself.</Text>

            <Text style={styles.label}>I am a</Text>
            <View style={styles.roleRow}>
              <TouchableOpacity
                style={[
                  styles.roleCard,
                  formData.role === 'STUDENT' && styles.roleCardActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'STUDENT' })}
              >
                <Feather
                  name="user"
                  size={24}
                  color={formData.role === 'STUDENT' ? COLORS.primary : COLORS.textBody}
                />
                <Text
                  style={[
                    styles.roleTitle,
                    formData.role === 'STUDENT' && styles.roleTitleActive,
                  ]}
                >
                  Student
                </Text>
                <Text style={styles.roleTag}>Learner</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleCard,
                  formData.role === 'PARENT' && styles.roleCardActive,
                ]}
                onPress={() => setFormData({ ...formData, role: 'PARENT' })}
              >
                <Feather
                  name="users"
                  size={24}
                  color={formData.role === 'PARENT' ? COLORS.primary : COLORS.textBody}
                />
                <Text
                  style={[
                    styles.roleTitle,
                    formData.role === 'PARENT' && styles.roleTitleActive,
                  ]}
                >
                  Parent
                </Text>
                <Text style={styles.roleTag}>Guardian</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. John Doe"
              value={formData.name}
              onChangeText={(t) => setFormData({ ...formData, name: t })}
            />

            <Text style={styles.label}>School</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Greenwood High"
              value={formData.school}
              onChangeText={(t) => setFormData({ ...formData, school: t })}
            />

            <Text style={styles.label}>Class / Grade</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 5th Grade"
              value={formData.schoolClass}
              onChangeText={(t) => setFormData({ ...formData, schoolClass: t })}
            />
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>What&apos;s your chess level?</Text>

            <View style={styles.levelCards}>
              {(['Beginner', 'Developing', 'Advanced'] as const).map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  style={[styles.levelCard, formData.level === lvl && styles.levelCardActive]}
                  onPress={() => setFormData({ ...formData, level: lvl })}
                >
                  <Text
                    style={[
                      styles.levelCardText,
                      formData.level === lvl && styles.levelCardTextActive,
                    ]}
                  >
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>FIDE ID (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 12345678"
              value={formData.fideId}
              onChangeText={(t) => setFormData({ ...formData, fideId: t })}
            />
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <Text style={styles.title}>
              {formData.role === 'PARENT'
                ? 'Your contact details (optional)'
                : 'Parent & Guardian details'}
            </Text>

            <Text style={styles.label}>
              {formData.role === 'PARENT' ? 'Guardian Name' : 'Parent Name'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Jane Doe"
              value={formData.parentName}
              onChangeText={(t) => setFormData({ ...formData, parentName: t })}
            />

            <Text style={styles.label}>
              {formData.role === 'PARENT' ? 'Guardian Email' : 'Parent Email'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. jane@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
              value={formData.parentEmail}
              onChangeText={(t) => setFormData({ ...formData, parentEmail: t })}
            />

            {formData.role !== 'PARENT' && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setFormData({ ...formData, consent: !formData.consent })}
              >
                <View style={[styles.checkbox, formData.consent && styles.checkboxActive]}>
                  {formData.consent && <Feather name="check" size={14} color={COLORS.white} />}
                </View>
                <Text style={styles.checkboxLabel}>I have my parent&apos;s consent to join ChessOne.</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, saving && styles.btnDisabled]}
          onPress={nextStep}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.btnText}>
              {step === 3 ? 'Build my learning path' : 'Continue'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textHeading },
  skipText: { fontSize: 14, color: COLORS.textBody, fontWeight: '600' },
  content: { padding: 20 },
  progressDots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 32 },
  dot: { width: 32, height: 4, borderRadius: 2, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.primary },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FDE8E8',
    padding: 12,
    borderRadius: SIZES.radiusCard,
    marginBottom: 16,
  },
  errorText: { color: '#A32D2D', fontSize: 14, flex: 1 },
  stepContainer: {},
  title: {
    fontSize: 26,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textHeading,
    marginBottom: 8,
    marginTop: 16,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  roleCard: {
    flex: 1,
    padding: 16,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 6,
  },
  roleCardActive: {
    backgroundColor: COLORS.hero,
    borderColor: COLORS.primary,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  roleTitleActive: {
    color: COLORS.primary,
  },
  roleTag: {
    fontSize: 12,
    color: COLORS.textBody,
  },
  input: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusButton,
    padding: 16,
    fontSize: 16,
    color: COLORS.textHeading,
  },
  levelCards: { gap: 12, marginBottom: 16 },
  levelCard: {
    padding: 20,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  levelCardActive: { backgroundColor: COLORS.hero, borderColor: COLORS.primary },
  levelCardText: { fontSize: 16, fontWeight: '600', color: COLORS.textHeading },
  levelCardTextActive: { color: COLORS.primary, fontWeight: '700' },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { flex: 1, fontSize: 14, color: COLORS.textBody, lineHeight: 20 },
  footer: { padding: 20, backgroundColor: COLORS.background },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: SIZES.radiusButton,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  btnText: { color: COLORS.white, fontSize: 16, fontWeight: 'bold' },
});
