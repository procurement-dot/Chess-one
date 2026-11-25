import React, { useEffect } from 'react';
import { AppState, AppStateStatus, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
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
  const { chessOneToken, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && chessOneToken) {
      gameSocket.updateAuth(chessOneToken);
      gameSocket.connect();
    } else {
      gameSocket.disconnect();
    }
  }, [isAuthenticated, chessOneToken]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && authStore.getState().isAuthenticated) {
        const curToken = authStore.getState().chessOneToken;
        if (curToken) {
          gameSocket.updateAuth(curToken);
          gameSocket.connect();
        }
      }
    };

    const sub = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      sub.remove();
    };
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
