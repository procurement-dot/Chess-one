/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#202d29',
    background: '#f5f7f2',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e5edda',
    textSecondary: '#74817a',
  },
  dark: {
    text: '#202d29',
    background: '#f5f7f2',
    backgroundElement: '#ffffff',
    backgroundSelected: '#e5edda',
    textSecondary: '#74817a',
  },
} as const;

/**
 * ChessOne School Design System Tokens
 * Verified from reference: https://chessone-school.nikhilladdha.chatgpt.site/style.css
 */
export const SchoolColors = {
  green: '#194e40',       // Primary Forest Green
  lime: '#d6ef9e',        // Playful Lime Accent
  ink: '#202d29',         // Deep Ink (Primary Text)
  muted: '#74817a',       // Muted Sage / Secondary Text
  paper: '#f5f7f2',       // Soft Paper (Page Background)
  line: '#e4e9e1',        // Subtle Border / Divider
  coral: '#f7a18c',       // Warm Coral Accent

  // Surfaces
  cardBg: '#ffffff',
  cardSoftGreen: '#eef3e8',
  cardSoftLime: '#e5edda',
  cardSoftCoral: '#fceddf',
  cardSoftMuted: '#edf2e7',

  // Chessboard Tokens
  boardBorder: '#d5dfc8',
  squareLight: '#eef0e0',
  squareDark: '#8ea780',
  squareSelected: '#e9cb67',
  moveIndicator: '#194e4070',
  whitePieceText: '#fffef3',
  blackPieceText: '#172b26',
  clockBg: '#e6ecdf',
  clockText: '#172b26',

  // Status & Alerts
  success: '#4F8A5B',
  warning: '#C99539',
  error: '#C75D57',
  info: '#5D82A6',
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
