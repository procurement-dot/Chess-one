import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useProfile } from '../hooks/useProfile';
import { authStore, useAuthStore } from '../store/authStore';
import { gameSocket } from '../socket/game.socket';
import { GlobalInvitationWatcher } from '../components/game/GlobalInvitationWatcher';

SplashScreen.preventAutoHideAsync();

function ProfileSynchronizer() {
  useProfile();
  return null;
}

function RootPresenceWatcher() {
  const router = useRouter();
  const { chessOneToken, isAuthenticated } = useAuthStore();

  // Keep socket auth in sync with app auth state
  useEffect(() => {
    if (isAuthenticated && chessOneToken) {
      gameSocket.updateAuth(chessOneToken);
    } else {
      gameSocket.disconnect();
    }
  }, [isAuthenticated, chessOneToken]);

  // Handle auth notifications from socket (never log user out of app on socket errors)
  useEffect(() => {
    const unsubAuthErr = gameSocket.onAuthError((err: any) => {
      console.warn('[RootPresenceWatcher] Socket auth error (retrying with current auth):', err);
      const token = authStore.getState().chessOneToken;
      if (token) {
        gameSocket.updateAuth(token);
      }
    });

    return () => {
      unsubAuthErr();
    };
  }, []);

  // Comprehensive mobile web & native presence lifecycle
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleWebActive = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        if (authStore.getState().isAuthenticated) {
          gameSocket.ensureConnected();
        }
      };

      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && authStore.getState().isAuthenticated) {
          gameSocket.ensureConnected();
        }
      };

      window.addEventListener('pageshow', handleWebActive);
      window.addEventListener('online', handleWebActive);
      window.addEventListener('focus', handleWebActive);
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        window.removeEventListener('pageshow', handleWebActive);
        window.removeEventListener('online', handleWebActive);
        window.removeEventListener('focus', handleWebActive);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    } else {
      // Native platforms
      const handleAppStateChange = (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && authStore.getState().isAuthenticated) {
          gameSocket.ensureConnected();
        }
      };

      const sub = AppState.addEventListener('change', handleAppStateChange);
      return () => {
        sub.remove();
      };
    }
  }, []);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <ProfileSynchronizer />
      <RootPresenceWatcher />
      <GlobalInvitationWatcher />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
