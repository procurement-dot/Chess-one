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
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="classes/index" options={{ headerShown: false }} />
        <Stack.Screen name="classes/create" options={{ headerShown: false }} />
        <Stack.Screen name="classes/join" options={{ headerShown: false }} />
        <Stack.Screen name="classes/[classId]/index" options={{ headerShown: false }} />
        <Stack.Screen name="classes/[classId]/members" options={{ headerShown: false }} />
        <Stack.Screen name="classes/[classId]/edit" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
