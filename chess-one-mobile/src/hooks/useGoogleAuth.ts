import { useState, useCallback, useEffect, useRef } from 'react';
import * as Google from 'expo-auth-session/providers/google';
import { GOOGLE_AUTH_CONFIG, isGoogleAuthConfigured } from '../constants/auth.config';
import {
  processAuthSessionResponse,
  exchangeGoogleTokenWithBackend,
  devLoginWithBackend,
} from '../services/auth.service';
import { GoogleAuthResult } from '../types/auth.types';
import { authStore } from '../store/authStore';

export interface UseGoogleAuthReturn {
  signInWithGoogle: () => Promise<GoogleAuthResult | null>;
  signInWithDevAccount: (userId?: number) => Promise<boolean>;
  signOut: () => void;
  isLoading: boolean;
  result: GoogleAuthResult | null;
  error: string | null;
  redirectUri: string | null;
}

/**
 * Authoritative hook for Google OAuth & backend JWT flow in ChessOne Mobile
 */
export function useGoogleAuth(): UseGoogleAuthReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<GoogleAuthResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prevent duplicate concurrent requests
  const isPromptingRef = useRef(false);
  const lastProcessedTokenRef = useRef<string | null>(null);

  // Initialize Expo AuthSession Google Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId: GOOGLE_AUTH_CONFIG.androidClientId || undefined,
    webClientId: GOOGLE_AUTH_CONFIG.webClientId || undefined,
    clientId: GOOGLE_AUTH_CONFIG.webClientId || undefined,
    redirectUri: GOOGLE_AUTH_CONFIG.redirectUri || undefined,
  });

  const handleAuthSuccess = useCallback(async (processed: GoogleAuthResult) => {
    if (!processed.success || !processed.idToken) return;

    // Deduplicate: avoid running concurrent or duplicate exchange for the same ID token
    if (lastProcessedTokenRef.current === processed.idToken) {
      return;
    }
    lastProcessedTokenRef.current = processed.idToken;

    try {
      const backendAuth = await exchangeGoogleTokenWithBackend(processed.idToken);
      if (backendAuth) {
        authStore.setChessOneToken(backendAuth.token);
        authStore.setGoogleAuth({
          user: {
            id: String(backendAuth.user.id),
            name: backendAuth.user.name,
            email: backendAuth.user.email,
            photo: backendAuth.user.avatarUrl || processed.user?.photo,
          },
          idToken: backendAuth.token,
          chessOneToken: backendAuth.token,
        });
      } else {
        authStore.setGoogleAuth({
          user: processed.user || null,
          idToken: processed.idToken || null,
        });
      }
    } catch (exchangeErr) {
      console.warn('[useGoogleAuth] Token exchange failed:', exchangeErr);
    }
  }, []);

  // Watch for auth session response completion
  useEffect(() => {
    if (!response) return;

    let isMounted = true;

    async function handleResponse() {
      try {
        const processed = await processAuthSessionResponse(response);

        if (!isMounted) return;

        setResult(processed);

        if (processed.success) {
          setError(null);
          await handleAuthSuccess(processed);
        } else if (processed.cancelled) {
          setError(processed.error || 'Google sign-in was cancelled.');
          authStore.setError(processed.error || 'Google sign-in was cancelled.');
        } else {
          const userFriendlyError =
            processed.error || 'Unable to sign in with Google. Please try again.';
          setError(userFriendlyError);
          authStore.setError(userFriendlyError);
        }
      } catch {
        if (!isMounted) return;
        const msg = 'Unable to sign in with Google. Please try again.';
        setError(msg);
        authStore.setError(msg);
      } finally {
        if (isMounted) {
          setIsLoading(false);
          authStore.setLoading(false);
          isPromptingRef.current = false;
        }
      }
    }

    handleResponse();

    return () => {
      isMounted = false;
    };
  }, [response, handleAuthSuccess]);

  const signInWithGoogle = useCallback(async (): Promise<GoogleAuthResult | null> => {
    if (isPromptingRef.current || isLoading) {
      return null;
    }

    if (!isGoogleAuthConfigured()) {
      const msg = 'Google Client IDs are missing. Set EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID in .env';
      setError(msg);
      authStore.setError(msg);
      return { success: false, error: msg };
    }

    try {
      isPromptingRef.current = true;
      setIsLoading(true);
      setError(null);
      authStore.setLoading(true);

      const promptResult = await promptAsync();
      const processed = await processAuthSessionResponse(promptResult);

      setResult(processed);

      if (processed.success) {
        setError(null);
        await handleAuthSuccess(processed);
      } else {
        const errMsg =
          processed.error ||
          (processed.cancelled
            ? 'Google sign-in was cancelled.'
            : 'Unable to sign in with Google. Please try again.');
        setError(errMsg);
        authStore.setError(errMsg);
      }

      return processed;
    } catch {
      const friendlyMsg = 'Unable to sign in with Google. Please try again.';
      setError(friendlyMsg);
      authStore.setError(friendlyMsg);
      return { success: false, error: friendlyMsg };
    } finally {
      setIsLoading(false);
      authStore.setLoading(false);
      isPromptingRef.current = false;
    }
  }, [promptAsync, isLoading, handleAuthSuccess]);

  const signOut = useCallback(() => {
    setResult(null);
    setError(null);
    authStore.clearAuth();
  }, []);

  const signInWithDevAccount = useCallback(async (userId: number = 1): Promise<boolean> => {
    setIsLoading(true);
    authStore.setLoading(true);
    try {
      const backendData = await devLoginWithBackend(userId);
      if (backendData) {
        authStore.setChessOneToken(backendData.token);
        authStore.setGoogleAuth({
          user: {
            id: String(backendData.user.id),
            name: backendData.user.name,
            email: backendData.user.email,
            photo: backendData.user.avatarUrl || undefined,
          },
          idToken: backendData.token,
          chessOneToken: backendData.token,
        });
        setResult({
          success: true,
          user: {
            id: String(backendData.user.id),
            name: backendData.user.name,
            email: backendData.user.email,
            photo: backendData.user.avatarUrl || undefined,
          },
          idToken: backendData.token,
        });
        return true;
      }

      // Offline fallback
      const fallbackUser = {
        id: String(userId),
        name: userId === 1 ? 'Player One' : 'Player Two',
        email: `player${userId}@chessone.local`,
      };
      const devToken = `dev-token-${userId}`;
      authStore.setChessOneToken(devToken);
      authStore.setGoogleAuth({
        user: fallbackUser,
        idToken: devToken,
        chessOneToken: devToken,
      });
      return true;
    } catch (err: any) {
      console.warn('[Auth] Dev login failed:', err);
      return false;
    } finally {
      setIsLoading(false);
      authStore.setLoading(false);
    }
  }, []);

  return {
    signInWithGoogle,
    signInWithDevAccount,
    signOut,
    isLoading,
    result,
    error,
    redirectUri: request?.redirectUri || null,
  };
}
