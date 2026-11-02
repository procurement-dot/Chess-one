import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { COLORS, SIZES, SHADOWS } from '../../../constants/chessone-theme';
import { classService } from '../../../services/class.service';
import { useClassStore } from '../../../store/classStore';
import { useClassRole } from '../../../hooks/useClassRole';
import { LoadingState, ErrorState, JoinCodeBox } from '../../../components/class';
import { getErrorMessage } from '../../../utils/classErrors';

const LEVELS = ['Beginner', 'Intermediate', 'Advanced'] as const;

export default function EditClassScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const parsedId = parseInt(classId || '0', 10);

  const { upsertClass, removeClass } = useClassStore();
  const { isOwner } = useClassRole(parsedId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Beginner');
  const [maxStudents, setMaxStudents] = useState('30');
  const [currentJoinCode, setCurrentJoinCode] = useState<string>('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const loadClass = useCallback(async () => {
    if (!parsedId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const cls = await classService.getClass(parsedId);
      setName(cls.name);
      setDescription(cls.description || '');
      setLevel(
        (cls.level as 'Beginner' | 'Intermediate' | 'Advanced') || 'Beginner'
      );
      setMaxStudents(String(cls.maxStudents || 30));
      setCurrentJoinCode(cls.joinCode || '');
      upsertClass(cls);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [parsedId, upsertClass]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3 || trimmedName.length > 80) {
      Alert.alert('Validation Error', 'Class name must be between 3 and 80 characters.');
      return;
    }

    const maxNum = parseInt(maxStudents, 10);
    if (isNaN(maxNum) || maxNum < 1 || maxNum > 200) {
      Alert.alert('Validation Error', 'Maximum students must be between 1 and 200.');
      return;
    }

    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await classService.updateClass(parsedId, {
        name: trimmedName,
        description: description.trim() || undefined,
        level,
        maxStudents: maxNum,
      });

      upsertClass(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      Alert.alert('Update Failed', getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateCode = () => {
    Alert.alert(
      'Regenerate Join Code',
      'The current code will stop working immediately. Any students who haven\'t joined will need the new code. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Regenerate',
          onPress: async () => {
            setIsRegenerating(true);
            try {
              const newCode = await classService.regenerateJoinCode(parsedId);
              setCurrentJoinCode(newCode);
              Alert.alert('New Code Generated', `The new join code is: ${newCode}`);
            } catch (err) {
              Alert.alert('Failed to Regenerate', getErrorMessage(err));
            } finally {
              setIsRegenerating(false);
            }
          },
        },
      ]
    );
  };

  const handleArchive = () => {
    Alert.alert(
      'Archive Class',
      'Are you sure you want to archive this class? It will be deactivated and removed from active teaching lists.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setIsArchiving(true);
            try {
              await classService.archiveClass(parsedId);
              removeClass(parsedId);
              router.replace('/classes' as any);
            } catch (err) {
              Alert.alert('Archive Failed', getErrorMessage(err));
              setIsArchiving(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Edit Class" showBack />
        <LoadingState message="Loading class details..." />
      </SafeAreaView>
    );
  }

  if (errorMsg && !name) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Edit Class" showBack />
        <ErrorState error={errorMsg} onRetry={loadClass} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Edit Class" subtitle="Batch settings & lifecycle" showBack />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.mainContainer}>
            {/* Join Code Box with Regenerate Option */}
            {currentJoinCode ? (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Class Access Code</Text>
                <JoinCodeBox joinCode={currentJoinCode} className={name} />

                <TouchableOpacity
                  style={styles.regenBtn}
                  onPress={handleRegenerateCode}
                  disabled={isRegenerating}
                  activeOpacity={0.8}
                >
                  {isRegenerating ? (
                    <ActivityIndicator color={COLORS.primary} size="small" />
                  ) : (
                    <>
                      <Feather name="refresh-cw" size={15} color={COLORS.primary} />
                      <Text style={styles.regenBtnText}>Regenerate Join Code</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {/* Edit Information Form */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Batch Details</Text>

              {saveSuccess && (
                <View style={styles.successBanner}>
                  <Feather name="check" size={16} color="#166534" />
                  <Text style={styles.successText}>Class updated successfully!</Text>
                </View>
              )}

              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Class Name</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  maxLength={80}
                />
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
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
                <Text style={styles.label}>Maximum Capacity</Text>
                <TextInput
                  style={styles.input}
                  value={maxStudents}
                  onChangeText={setMaxStudents}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <>
                    <Feather name="save" size={16} color={COLORS.white} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Danger Zone: Archive Class (Owner only) */}
            {isOwner && (
              <View style={[styles.card, styles.dangerCard]}>
                <Text style={styles.dangerTitle}>Archive Class</Text>
                <Text style={styles.dangerDesc}>
                  Archiving this class will permanently make it read-only and hide it from all students and coaches.
                </Text>

                <TouchableOpacity
                  style={styles.archiveBtn}
                  onPress={handleArchive}
                  disabled={isArchiving}
                  activeOpacity={0.8}
                >
                  {isArchiving ? (
                    <ActivityIndicator color="#DC2626" />
                  ) : (
                    <>
                      <Feather name="archive" size={16} color="#DC2626" />
                      <Text style={styles.archiveBtnText}>Archive This Class</Text>
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
    width: '100%',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 14,
  },
  regenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F8FAF5',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    borderRadius: 12,
  },
  regenBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#DCFCE7',
    padding: 10,
    borderRadius: 10,
    marginBottom: 14,
  },
  successText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '700',
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
  saveBtn: {
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
  saveBtnDisabled: {
    opacity: 0.6,
  },
  saveBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  dangerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 6,
  },
  dangerDesc: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 18,
    marginBottom: 14,
  },
  archiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    borderRadius: 12,
  },
  archiveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#DC2626',
  },
});
