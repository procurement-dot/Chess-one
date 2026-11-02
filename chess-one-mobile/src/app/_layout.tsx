import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider, Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { useProfile } from '../hooks/useProfile';
import { setOnUnauthorized } from '../services/apiClient';
import { authStore } from '../store/authStore';

SplashScreen.preventAutoHideAsync();

function ProfileSynchronizer() {
  useProfile();
  return null;
}

function AuthLifecycleManager() {
  const router = useRouter();

  useEffect(() => {
    setOnUnauthorized(() => {
      authStore.clearAuth();
      router.replace('/');
    });

    // On app start: if chess_one_token exists, call GET /api/auth/me
    authStore.syncCurrentUser();
  }, [router]);

  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AuthLifecycleManager />
      <ProfileSynchronizer />
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
