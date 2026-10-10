import React, { useState } from 'react';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { gameService } from '../../services/game.service';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';

export default function JoinMatchScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      Alert.alert('Required', 'Please enter a game code.');
      return;
    }

    setIsJoining(true);
    try {
      const response = await gameService.joinGame(cleanCode);
      const gameId = response.game?.gameId || response.game?.id || (response as any).gameId;
      router.replace(`/game/${gameId}` as any);
    } catch (err: any) {
      const msg =
        err.userFriendlyMessage ||
        err.message ||
        'Unable to join match. Verify the code and try again.';
      Alert.alert('Join Failed', msg);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <AppHeader
        title="Join Match"
        subtitle="Connect with 6-digit room code"
        showBack={true}
      />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🔗</Text>
          </View>

          <Text style={styles.heading}>Enter Room Code</Text>
          <Text style={styles.subheading}>
            Ask your friend for their 6-character room code to join their chess game.
          </Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.codeInput}
              placeholder="e.g. ABC123"
              placeholderTextColor="#475569"
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={8}
            />
          </View>

          <TouchableOpacity
            style={[styles.joinButton, !code.trim() && styles.joinButtonDisabled]}
            activeOpacity={0.85}
            disabled={!code.trim() || isJoining}
            onPress={handleJoin}
          >
            {isJoining ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.joinButtonText}>Join Match</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Persistent Bottom Footer */}
      <AppFooter activeTab="community" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 26,
    color: COLORS.primary,
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  spacer: {
    width: 40,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.hero,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconText: {
    fontSize: 34,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 280,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  codeInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: SIZES.radiusCard,
    height: 64,
    color: COLORS.textHeading,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
    ...SHADOWS.soft,
  },
  joinButton: {
    width: '100%',
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: SIZES.radiusButton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
