import { useState, useCallback, useRef } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_AUTH_CONFIG, isGoogleAuthConfigured } from '../constants/auth.config';
import {
  processAuthSessionResponse,
  exchangeGoogleTokenWithBackend,
} from '../services/auth.service';
import { GoogleAuthResult } from '../types/auth.types';
import { authStore } from '../store/authStore';
import { roleStore } from '../features/roles/roleStore';
import { gameSocket } from '../socket/game.socket';

export interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<GoogleAuthResult | null>;
  signOut: () => void;
  isLoading: boolean;
  isConfigured: boolean;
  result: GoogleAuthResult | null;
  error: string | null;
  redirectUri: string | null;
}

/**
 * Authoritative hook for Google OAuth & backend JWT flow in ChessOne Mobile
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
  const isConfigured = isGoogleAuthConfigured();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GoogleAuthResult | null>(null);
  const [error, setError] = useState<string | null>(() =>
    isConfigured
      ? null
      : 'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in the mobile app .env file and restart Expo.'
  );

  // Prevent duplicate concurrent requests
  const isPromptingRef = useRef(false);

  // Initialize Expo AuthSession Google Request
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId || undefined,
    webClientId: GOOGLE_AUTH_CONFIG.webClientId || undefined,
    clientId: GOOGLE_AUTH_CONFIG.webClientId || undefined,
    redirectUri: GOOGLE_AUTH_CONFIG.redirectUri || undefined,
  });

  const handleAuthSuccess = useCallback(async (processed: GoogleAuthResult): Promise<GoogleAuthResult | null> => {
    if (!processed.success) return processed;
    if (!processed.idToken) {
      const errMsg = 'Google did not return an ID token. Please try signing in again.';
      setError(errMsg);
      authStore.setError(errMsg);
      const failureResult: GoogleAuthResult = { success: false, error: errMsg };
      setResult(failureResult);
      return failureResult;
    }

    try {
      const backendAuth = await exchangeGoogleTokenWithBackend(processed.idToken, {
        name: processed.user?.name,
        avatarUrl: processed.user?.photo,
      });
      if (backendAuth) {
        const resolvedName =
          processed.user?.name && !processed.user.name.startsWith('Player')
            ? processed.user.name
            : backendAuth.user.name && !backendAuth.user.name.startsWith('Player')
            ? backendAuth.user.name
            : processed.user?.name || backendAuth.user.name;

        const fullUser = {
          id: String(backendAuth.user.id),
          name: resolvedName,
          email: backendAuth.user.email || processed.user?.email,
          photo: backendAuth.user.avatarUrl || processed.user?.photo,
          role: backendAuth.user.role,
          rating: backendAuth.user.rating,
          gamesPlayed: backendAuth.user.gamesPlayed,
          onboardingDone: backendAuth.user.onboardingDone ?? true,
        };
        authStore.setChessOneToken(backendAuth.token);
        authStore.setGoogleAuth({
          user: fullUser,
          idToken: processed.idToken,
          chessOneToken: backendAuth.token,
        });
        if (backendAuth.user.role) {
          roleStore.syncFromServer(backendAuth.user.role);
        }
        gameSocket.updateAuth(backendAuth.token);
        const successResult = {
          ...processed,
          user: fullUser,
          chessOneToken: backendAuth.token,
        };
        setResult(successResult);
        return successResult;
      } else {
        const errMsg = 'Failed to connect to backend server. Please verify backend is running on port 4000.';
        setError(errMsg);
        authStore.setError(errMsg);
        authStore.clearAuth();
        const failureResult: GoogleAuthResult = {
          success: false,
          error: errMsg,
        };
        setResult(failureResult);
        return failureResult;
      }
    } catch (exchangeErr) {
      console.warn('[useGoogleAuth] Token exchange failed:', exchangeErr);
      const errMsg =
        exchangeErr instanceof Error
          ? exchangeErr.message
          : 'Unable to complete sign in. Please try again.';
      setError(errMsg);
      authStore.setError(errMsg);
      authStore.clearAuth();
      const failureResult: GoogleAuthResult = {
        success: false,
        error: errMsg,
      };
      setResult(failureResult);
      return failureResult;
    }
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult | null> => {
    if (isPromptingRef.current || isLoading) {
      return null;
    }

    if (!isConfigured) {
      const msg =
        'Google sign-in is not configured. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in the mobile app .env file and restart Expo.';
      setError(msg);
      authStore.setError(msg);
      return { success: false, error: msg };
    }

    try {
      isPromptingRef.current = true;
      setIsLoading(true);
      setError(null);
      authStore.setLoading(true);

      let promptTimeout: ReturnType<typeof setTimeout> | undefined;
      const promptResult = await Promise.race([
        promptAsync(),
        new Promise<never>((_, reject) => {
          promptTimeout = setTimeout(
            () => reject(new Error('Google sign-in timed out. Please try again.')),
            60000
          );
        }),
      ]).finally(() => {
        if (promptTimeout) clearTimeout(promptTimeout);
      });
      const processed = await processAuthSessionResponse(promptResult);

      setResult(processed);

      if (processed.success) {
        setError(null);
        const finalResult = await handleAuthSuccess(processed);
        return finalResult || processed;
      } else if (processed.cancelled) {
        setError(null);
        authStore.setError(null);
      } else {
        const errMsg = processed.error || 'Unable to sign in with Google. Please try again.';
        setError(errMsg);
        authStore.setError(errMsg);
      }

      return processed;
    } catch (authErr) {
      const friendlyMsg =
        authErr instanceof Error
          ? authErr.message
          : 'Unable to sign in with Google. Please try again.';
      setError(friendlyMsg);
      authStore.setError(friendlyMsg);
      return { success: false, error: friendlyMsg };
    } finally {
      setIsLoading(false);
      authStore.setLoading(false);
      isPromptingRef.current = false;
    }
  }, [promptAsync, isLoading, handleAuthSuccess, isConfigured]);

  const signOut = useCallback(() => {
    setResult(null);
    setError(null);
    authStore.clearAuth();
    gameSocket.disconnect();
  }, []);

  return {
    signInWithGoogle,
    signOut,
    isLoading,
    isConfigured,
    result,
    error,
    redirectUri: request?.redirectUri || null,
  };
}
