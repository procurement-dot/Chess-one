import React, { useState } from 'react';
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
      const playerColor = response.game?.playerColor || (response as any).playerColor || 'BLACK';

      if (gameId && typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`chess_game_color_${gameId}`, playerColor);
      }

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
      <StatusBar barStyle="dark-content" />

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
              placeholderTextColor="#74817A"
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
              <Text style={[styles.joinButtonText, !code.trim() && styles.joinButtonTextDisabled]}>
                Join Match
              </Text>
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
    backgroundColor: '#F5F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 26,
    color: '#202D29',
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202D29',
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
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  iconText: {
    fontSize: 34,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 8,
    textAlign: 'center',
  },
  subheading: {
    fontSize: 14,
    color: '#74817A',
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
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E4E9E1',
    borderRadius: 16,
    height: 64,
    color: '#202D29',
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  joinButton: {
    width: '100%',
    backgroundColor: '#194E40',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  joinButtonDisabled: {
    backgroundColor: '#E4E9E1',
    shadowOpacity: 0,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  joinButtonTextDisabled: {
    color: '#74817A',
  },
});
