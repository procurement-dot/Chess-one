import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

const SchoolTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#f5f7f2',
    card: '#ffffff',
    text: '#202d29',
    border: '#e4e9e1',
    primary: '#194e40',
  },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={SchoolTheme}>
      <AnimatedSplashOverlay />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#f5f7f2' },
        }}
      />
    </ThemeProvider>
  );
}
