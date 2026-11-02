import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
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
import { getErrorMessage } from '../../utils/classErrors';

export default function JoinClassScreen() {
  const router = useRouter();
  const { upsertClass } = useClassStore();

  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setErrorMsg('Please enter a 6-character class code.');
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMsg('Class code must be exactly 6 characters.');
      return;
    }

    setIsJoining(true);
    setErrorMsg(null);

    try {
      const joinedClass = await classService.joinClass(cleanCode);
      upsertClass(joinedClass);
      router.replace(`/classes/${joinedClass.id}` as any);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsJoining(false);
    }
  };

  // Filter input to valid alphanumeric uppercase
  const handleChangeText = (text: string) => {
    const filtered = text.toUpperCase().replace(/[^A-HJ-NP-Z2-9]/g, '');
    setCode(filtered);
    if (errorMsg) setErrorMsg(null);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Join Class" subtitle="Enroll with code" showBack />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Feather name="key" size={32} color={COLORS.primary} />
          </View>

          <Text style={styles.heading}>Enter Class Code</Text>
          <Text style={styles.subheading}>
            Ask your chess coach for their 6-character class code to join the batch.
          </Text>

          {errorMsg ? (
            <View style={styles.errorAlert}>
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text style={styles.errorAlertText}>{errorMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. BATCHA"
              placeholderTextColor="#94A3B8"
              value={code}
              onChangeText={handleChangeText}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={6}
              accessibilityLabel="Class join code"
            />
          </View>

          <TouchableOpacity
            style={[styles.joinButton, (!code.trim() || isJoining) && styles.joinButtonDisabled]}
            activeOpacity={0.85}
            disabled={!code.trim() || isJoining}
            onPress={handleJoin}
          >
            {isJoining ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.joinButtonText}>Join Class</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.hero,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
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
    width: '100%',
  },
  errorAlertText: {
    fontSize: 13,
    color: '#DC2626',
    flex: 1,
    fontWeight: '600',
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  codeInput: {
    backgroundColor: '#F8FAF5',
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 26,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 6,
    textAlign: 'center',
    color: COLORS.textHeading,
  },
  joinButton: {
    backgroundColor: COLORS.primary,
    width: '100%',
    paddingVertical: 14,
    borderRadius: SIZES.radiusButton || 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
