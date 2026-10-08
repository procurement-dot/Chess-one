import Constants from 'expo-constants';

/**
 * Centralized Google OAuth Client Configuration
 * Client IDs are read from environment variables (EXPO_PUBLIC_*)
 * Never hardcode these values across UI components.
 */
export const GOOGLE_AUTH_CONFIG = {
  androidClientId:
    process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleAndroidClientId ||
    '',
  webClientId:
    process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
    Constants.expoConfig?.extra?.googleWebClientId ||
    '',
  redirectUri:
    process.env.EXPO_PUBLIC_GOOGLE_REDIRECT_URI ||
    Constants.expoConfig?.extra?.googleRedirectUri ||
    '',
  // Custom scheme configured in app.json
  scheme: 'chessone',
  packageName: 'com.chessone.app',
};

/**
 * Check if the minimum required Google OAuth configuration is present
 */
export function isGoogleAuthConfigured(): boolean {
  return Boolean(
    GOOGLE_AUTH_CONFIG.androidClientId || GOOGLE_AUTH_CONFIG.webClientId
  );
}
