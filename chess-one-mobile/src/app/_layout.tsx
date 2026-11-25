import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useProfile } from '../hooks/useProfile';
import { authStore, useAuthStore } from '../store/authStore';
import { gameSocket } from '../socket/game.socket';

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

  // Handle auth errors (e.g. invalid/expired token from socket)
  useEffect(() => {
    const unsubAuthErr = gameSocket.onAuthError((err: any) => {
      console.warn('[RootPresenceWatcher] Auth error from server:', err);
      authStore.logout();
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('auth_notice', 'Session expired, please sign in again');
      }
      try {
        router.replace('/login');
      } catch {}
    });

    return () => {
      unsubAuthErr();
    };
  }, [router]);

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
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
