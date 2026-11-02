import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { classService } from '../../services/class.service';
import { useClassStore } from '../../store/classStore';
import { ClassDTO } from '../../types/class.types';
import { JoinCodeBox } from '../../components/class/JoinCodeBox';
import { getErrorMessage } from '../../utils/classErrors';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function CreateClassScreen() {
  const router = useRouter();
  const { upsertClass } = useClassStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [maxStudents, setMaxStudents] = useState('30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdClass, setCreatedClass] = useState<ClassDTO | null>(null);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 80) {
      setErrorMsg('Class name must be between 3 and 80 characters.');
      return;
    }

    const maxNum = parseInt(maxStudents, 10);
    if (isNaN(maxNum) || maxNum < 1 || maxNum > 200) {
      setErrorMsg('Maximum students must be between 1 and 200.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const newClass = await classService.createClass({
        name: trimmedName,
        description: description.trim() || undefined,
        level,
        maxStudents: maxNum,
      });

      upsertClass(newClass);
      setCreatedClass(newClass);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader
        title={createdClass ? 'Class Created' : 'Create Class'}
        subtitle="Coach batch creation"
        showBack
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formCard}>
            {createdClass ? (
              /* Success State with JoinCodeBox */
              <View style={styles.successWrapper}>
                <View style={styles.successIconBox}>
                  <Feather name="check-circle" size={44} color="#166534" />
                </View>

                <Text style={styles.successHeading}>Class Created Successfully!</Text>
                <Text style={styles.successSubheading}>
                  Your class &ldquo;{createdClass.name}&rdquo; is ready for students.
                </Text>

                {createdClass.joinCode ? (
                  <JoinCodeBox
                    joinCode={createdClass.joinCode}
                    className={createdClass.name}
                  />
                ) : null}

                <TouchableOpacity
                  style={styles.goToClassBtn}
                  onPress={() => router.replace(`/classes/${createdClass.id}` as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.goToClassBtnText}>Go to Class Home</Text>
                  <Feather name="arrow-right" size={18} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ) : (
              /* Form State */
              <View>
                <Text style={styles.formHeaderTitle}>Class Information</Text>
                <Text style={styles.formHeaderSub}>
                  Setup your batch details, capacity, and student target level.
                </Text>

                {errorMsg ? (
                  <View style={styles.errorAlert}>
                    <Feather name="alert-circle" size={16} color="#DC2626" />
                    <Text style={styles.errorAlertText}>{errorMsg}</Text>
                  </View>
                ) : null}

                {/* Name */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Class Name <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Beginners Batch A"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={(val) => {
                      setName(val);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    maxLength={80}
                  />
                  <Text style={styles.helperText}>3 to 80 characters</Text>
                </View>

                {/* Description */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Brief syllabus, session schedule or coach notes..."
                    placeholderTextColor="#94A3B8"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                  />
                </View>

                {/* Level Selector */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Skill Level</Text>
                  <View style={styles.levelRow}>
                    {LEVELS.map((lvl) => {
                      const isSelected = level === lvl;
                      return (
                        <TouchableOpacity
                          key={lvl}
                          style={[styles.levelBtn, isSelected && styles.levelBtnActive]}
                          onPress={() => setLevel(lvl)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.levelBtnText,
                              isSelected && styles.levelBtnTextActive,
                            ]}
                          >
                            {lvl}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Max Students */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Maximum Students Capacity</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="30"
                    placeholderTextColor="#94A3B8"
                    value={maxStudents}
                    onChangeText={setMaxStudents}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                  <Text style={styles.helperText}>Default is 30 (range 1 - 200)</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitBtn,
                    (!name.trim() || isSubmitting) && styles.submitBtnDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!name.trim() || isSubmitting}
                  activeOpacity={0.8}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color={COLORS.white} />
                  ) : (
                    <>
                      <Feather name="check" size={18} color={COLORS.white} />
                      <Text style={styles.submitBtnText}>Create Batch</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  formHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  formHeaderSub: {
    fontSize: 13,
    color: COLORS.textBody,
    marginBottom: 18,
    lineHeight: 18,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorAlertText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 6,
  },
  requiredStar: {
    color: '#DC2626',
  },
  input: {
    backgroundColor: '#F8FAF5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textHeading,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    fontSize: 11,
    color: COLORS.textBody,
    marginTop: 4,
  },
  levelRow: {
    flexDirection: 'row',
    gap: 8,
  },
  levelBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  levelBtnActive: {
    backgroundColor: COLORS.hero,
    borderColor: COLORS.primary,
  },
  levelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  levelBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: SIZES.radiusButton || 12,
    marginTop: 8,
    ...SHADOWS.soft,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 6,
    textAlign: 'center',
  },
  successSubheading: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    marginBottom: 20,
  },
  goToClassBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: SIZES.radiusButton || 12,
    width: '100%',
    marginTop: 8,
  },
  goToClassBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
