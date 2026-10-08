import { DarkTheme, DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import React, { useEffect } from 'react';
import { Platform } from 'react-native';
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
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'suppress-netlify-badge-style';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          #netlify-drawer-root,
          #netlify-drawer,
          [data-netlify-badge],
          [data-netlify-drawer],
          .netlify-badge,
          iframe[src*="netlify"],
          iframe[title*="Netlify"],
          iframe[id*="netlify"],
          a[href*="netlify.com"],
          div[id*="netlify"],
          div[class*="netlify-drawer"] {
            display: none !important;
            pointer-events: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            position: absolute !important;
            top: -9999px !important;
            left: -9999px !important;
            width: 0 !important;
            height: 0 !important;
            z-index: -999999 !important;
          }
        `;
        document.head.appendChild(style);
      }

      const removeBadge = () => {
        const selectors = [
          '#netlify-drawer-root',
          '#netlify-drawer',
          '[data-netlify-badge]',
          '[data-netlify-drawer]',
          '.netlify-badge',
          'iframe[src*="netlify"]',
          'iframe[title*="Netlify"]',
          'iframe[id*="netlify"]',
          'a[href*="netlify.com"]',
          'div[id*="netlify"]',
          'div[class*="netlify-drawer"]',
        ];
        selectors.forEach((sel) => {
          try {
            document.querySelectorAll(sel).forEach((el) => el.remove());
          } catch {}
        });
      };

      removeBadge();
      const interval = setInterval(removeBadge, 1000);
      return () => clearInterval(interval);
    }
  }, []);
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
