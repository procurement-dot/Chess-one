import * as WebBrowser from 'expo-web-browser';
import { AuthSessionResult } from 'expo-auth-session';
import { BackendRole, GoogleAuthResult, GoogleUser } from '../types/auth.types';
import { getApiBaseUrl } from './apiClient';

// Complete any pending auth session if redirected back to web/app
WebBrowser.maybeCompleteAuthSession();

/**
 * Pure JS base64 decoding fallback for environments where global atob is missing
 */
function decodeBase64(input: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  const str = input.replace(/=+$/, '');
  let output = '';

  for (
    let bc = 0, bs = 0, buffer: any, idx = 0;
    (buffer = str.charAt(idx++));
    ~buffer && ((bs = bc % 4 ? bs * 64 + buffer : buffer), bc++ % 4)
      ? (output += String.fromCharCode(255 & (bs >> ((-2 * bc) & 6))))
      : 0
  ) {
    buffer = chars.indexOf(buffer);
  }

  return output;
}

/**
 * Safely parse a JWT payload (such as Google ID token) without external libraries
 */
export function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');

    // Decode base64
    const decodedString =
      typeof globalThis.atob === 'function'
        ? globalThis.atob(base64)
        : decodeBase64(base64);

    return JSON.parse(decodedString);
  } catch {
    return null;
  }
}

/**
 * Fetch Google User profile info using access token
 */
export async function fetchGoogleUserInfo(
  accessToken: string
): Promise<GoogleUser | null> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/userinfo/v2/me',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      photo: data.picture,
      givenName: data.given_name,
      familyName: data.family_name,
    };
  } catch {
    return null;
  }
}

/**
 * Safely log non-sensitive Google authentication result for debugging
 */
export function logSafeAuthResult(result: GoogleAuthResult): void {
  if (result.success) {
    console.log('[Auth] Google authentication successful');
    if (result.user?.email) {
      console.log(`[Auth] Email: ${result.user.email}`);
    }
    console.log(`[Auth] Has ID token: ${Boolean(result.idToken)}`);
  } else if (result.cancelled) {
    console.log('[Auth] Google authentication cancelled by user');
  } else {
    console.warn('[Auth] Google authentication error:', result.error);
  }
}

/**
 * Process raw AuthSessionResult into structured GoogleAuthResult
 */
export async function processAuthSessionResponse(
  response: AuthSessionResult | null
): Promise<GoogleAuthResult> {
  if (!response) {
    return {
      success: false,
      error: 'Unable to sign in with Google. Please try again.',
    };
  }

  if (response.type === 'cancel' || response.type === 'dismiss') {
    return {
      success: false,
      cancelled: true,
      error: 'Google sign-in was cancelled.',
    };
  }

  if (response.type !== 'success') {
    const respAny = response as any;
    const errorDetails =
      respAny.params?.error_description ||
      respAny.params?.error ||
      respAny.error?.message;

    return {
      success: false,
      error: errorDetails
        ? `Google OAuth Error: ${errorDetails}`
        : 'Unable to sign in with Google. Please try again.',
    };
  }

  // Response was successful
  const params = response.params || {};
  const idToken =
    (response as any).authentication?.idToken ||
    params.id_token ||
    undefined;
  const accessToken =
    (response as any).authentication?.accessToken ||
    params.access_token ||
    undefined;

  let user: GoogleUser | undefined;

  // 1. Try extracting user identity from ID token payload
  if (idToken) {
    const payload = decodeJwtPayload(idToken);
    if (payload) {
      user = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        photo: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name,
      };
    }
  }

  // 2. If user profile missing and access token exists, fetch from userinfo endpoint
  if (!user && accessToken) {
    const fetchedUser = await fetchGoogleUserInfo(accessToken);
    if (fetchedUser) {
      user = fetchedUser;
    }
  }

  const result: GoogleAuthResult = {
    success: true,
    idToken,
    accessToken,
    user,
  };

  // Safe developer logging (never logs raw tokens)
  logSafeAuthResult(result);

  return result;
}

export interface BackendAuthResult {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
    role?: BackendRole;
    rating?: number;
    gamesPlayed?: number;
    onboardingDone?: boolean;
  };
}

/**
 * Call backend to exchange Google ID token for ChessOne JWT and user profile
 */
export async function exchangeGoogleTokenWithBackend(
  idToken: string,
  profile?: { name?: string; avatarUrl?: string | null }
): Promise<BackendAuthResult | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        idToken,
        name: profile?.name || undefined,
        avatarUrl: profile?.avatarUrl || undefined,
      }),
      signal: controller.signal,
    });

    const json = await response.json().catch(() => null);
    if (!response.ok) {
      const message =
        json?.error?.message || `Backend Google sign-in failed (${response.status}).`;
      throw new Error(message);
    }

    if (!json?.success) {
      throw new Error(json?.error?.message || 'Backend could not complete Google sign-in.');
    }

    const token = json.token || json.data?.token;
    const user = json.user || json.data?.user;

    if (!token || !user) {
      throw new Error('Backend response is missing the sign-in token or user profile.');
    }

    return { token, user };
  } catch (err) {
    console.warn('Error connecting to backend auth:', err);
    if (controller.signal.aborted) {
      throw new Error('Backend sign-in timed out. Check that the backend and database are available.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}
