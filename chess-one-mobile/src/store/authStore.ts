import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, GoogleUser } from '../types/auth.types';

type Listener = () => void;

const STORAGE_TOKEN_KEY = 'chess_one_token';
const STORAGE_USER_KEY = 'chess_one_user';
const STORAGE_GOOGLE_KEY = 'chess_one_google_token';

function getStoredString(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
      // Prioritize persistent localStorage so user stays logged in across sessions
      if (window.localStorage) {
        const localVal = window.localStorage.getItem(key);
        if (localVal) return localVal;
      }
      if (window.sessionStorage) {
        const sessionVal = window.sessionStorage.getItem(key);
        if (sessionVal) return sessionVal;
      }
    }
  } catch {}
  return null;
}

function setStoredString(key: string, val: string | null) {
  try {
    if (typeof window !== 'undefined') {
      // Always persist to localStorage for permanent login retention
      if (window.localStorage) {
        if (val) {
          window.localStorage.setItem(key, val);
        } else {
          window.localStorage.removeItem(key);
        }
      }
      if (window.sessionStorage) {
        if (val) {
          window.sessionStorage.setItem(key, val);
        } else {
          window.sessionStorage.removeItem(key);
        }
      }
    }
  } catch {}
}

export function extractUserFromToken(token: string | null): { id: string; email?: string; name?: string } | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length >= 2) {
      const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = typeof atob === 'function' ? atob(b64) : '';
      if (!json) return null;
      const payload = JSON.parse(json);
      const id = payload.userId || payload.id;
      if (id) {
        return {
          id: String(id),
          email: payload.email,
          name: payload.name,
        };
      }
    }
  } catch {}
  return null;
}

function getStoredUser(): GoogleUser | null {
  try {
    const raw = getStoredString(STORAGE_USER_KEY);
    const user = raw ? JSON.parse(raw) : null;
    const token = getStoredString(STORAGE_TOKEN_KEY);
    const tokenUser = extractUserFromToken(token);
    if (user) {
      if (tokenUser?.id) user.id = tokenUser.id;
      if (!user.email && tokenUser?.email) user.email = tokenUser.email;
      if (!user.name || user.name?.startsWith('Player #') || user.name?.startsWith('Player ') || user.name === 'Chess Player') {
        if (tokenUser?.name && !tokenUser.name.startsWith('Player')) {
          user.name = tokenUser.name;
        } else if (user.email && user.email.includes('@') && !user.email.includes('local')) {
          const prefix = user.email.split('@')[0].replace(/[._-]/g, ' ');
          user.name = prefix.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        } else if (tokenUser?.email && tokenUser.email.includes('@') && !tokenUser.email.includes('local')) {
          const prefix = tokenUser.email.split('@')[0].replace(/[._-]/g, ' ');
          user.name = prefix.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        }
      }
      return user;
    }
    if (tokenUser) {
      return {
        id: tokenUser.id,
        email: tokenUser.email || '',
        name: tokenUser.name || tokenUser.email?.split('@')[0] || `Player ${tokenUser.id}`,
      };
    }
    return user;
  } catch {}
  return null;
}

class AuthStore {
  private state: AuthState = (() => {
    const token = getStoredString(STORAGE_TOKEN_KEY);
    const user = getStoredUser();
    const googleIdToken = getStoredString(STORAGE_GOOGLE_KEY);
    return {
      isAuthenticated: Boolean(token),
      user,
      googleIdToken,
      chessOneToken: token,
      isLoading: false,
      error: null,
    };
  })();

  private listeners: Set<Listener> = new Set();

  getState(): AuthState {
    return this.state;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  setLoading(isLoading: boolean) {
    this.state = { ...this.state, isLoading };
    this.notify();
  }

  setError(error: string | null) {
    this.state = { ...this.state, error, isLoading: false };
    this.notify();
  }

  setGoogleAuth({
    user,
    idToken,
    chessOneToken,
  }: {
    user: GoogleUser | null;
    idToken: string | null;
    chessOneToken?: string | null;
  }) {
    // Only valid backend JWT should populate chessOneToken. Never use Google ID token.
    const token =
      chessOneToken ||
      (this.state.chessOneToken && this.state.chessOneToken !== idToken
        ? this.state.chessOneToken
        : null);

    let finalUser = user || this.state.user;
    const tokenUser = extractUserFromToken(token);
    if (tokenUser && finalUser) {
      finalUser = {
        ...finalUser,
        id: tokenUser.id,
        email: finalUser.email || tokenUser.email,
      };
    }

    if (token) {
      setStoredString(STORAGE_TOKEN_KEY, token);
      AsyncStorage.setItem(STORAGE_TOKEN_KEY, token).catch(() => {});
    } else {
      setStoredString(STORAGE_TOKEN_KEY, null);
      AsyncStorage.removeItem(STORAGE_TOKEN_KEY).catch(() => {});
    }

    if (finalUser) {
      setStoredString(STORAGE_USER_KEY, JSON.stringify(finalUser));
      AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(finalUser)).catch(() => {});
      AsyncStorage.setItem('@chessone_user', JSON.stringify(finalUser)).catch(() => {});
    }
    if (idToken) {
      setStoredString(STORAGE_GOOGLE_KEY, idToken);
      AsyncStorage.setItem(STORAGE_GOOGLE_KEY, idToken).catch(() => {});
    }

    this.state = {
      isAuthenticated: Boolean(token),
      user: finalUser,
      googleIdToken: idToken || this.state.googleIdToken,
      chessOneToken: token,
      isLoading: false,
      error: null,
    };
    this.notify();
  }

  updateUser(partial: Partial<GoogleUser>) {
    const updated = this.state.user
      ? { ...this.state.user, ...partial }
      : (partial as GoogleUser);
    this.state = {
      ...this.state,
      user: updated,
    };
    setStoredString(STORAGE_USER_KEY, JSON.stringify(updated));
    try {
      AsyncStorage.setItem('@chessone_user', JSON.stringify(updated)).catch(() => {});
      AsyncStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated)).catch(() => {});
    } catch {}
    this.notify();
  }

  setChessOneToken(chessOneToken: string | null) {
    setStoredString(STORAGE_TOKEN_KEY, chessOneToken);
    const tokenUser = extractUserFromToken(chessOneToken);
    let updatedUser = this.state.user;
    if (tokenUser && updatedUser) {
      const bestName =
        updatedUser.name && !updatedUser.name.startsWith('Player')
          ? updatedUser.name
          : tokenUser.name && !tokenUser.name.startsWith('Player')
          ? tokenUser.name
          : updatedUser.name;

      updatedUser = {
        ...updatedUser,
        id: tokenUser.id,
        name: bestName,
        email: updatedUser.email || tokenUser.email,
      };
    } else if (tokenUser && !updatedUser) {
      let resolvedName = tokenUser.name && !tokenUser.name.startsWith('Player') ? tokenUser.name : null;
      if (!resolvedName && tokenUser.email && tokenUser.email.includes('@') && !tokenUser.email.includes('local')) {
        const prefix = tokenUser.email.split('@')[0].replace(/[._-]/g, ' ');
        resolvedName = prefix.split(' ').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      }

      updatedUser = {
        id: tokenUser.id,
        email: tokenUser.email || '',
        name: resolvedName || `Player ${tokenUser.id}`,
      };
    }
    if (updatedUser) {
      setStoredString(STORAGE_USER_KEY, JSON.stringify(updatedUser));
    }

    this.state = {
      ...this.state,
      user: updatedUser,
      chessOneToken,
      isAuthenticated: Boolean(chessOneToken),
    };
    this.notify();
  }

  clearAuth() {
    setStoredString(STORAGE_TOKEN_KEY, null);
    setStoredString(STORAGE_USER_KEY, null);
    setStoredString(STORAGE_GOOGLE_KEY, null);
    this.state = {
      isAuthenticated: false,
      user: null,
      googleIdToken: null,
      chessOneToken: null,
      isLoading: false,
      error: null,
    };
    this.notify();
  }

  logout() {
    this.clearAuth();
  }
}

export const authStore = new AuthStore();

/**
 * React hook to subscribe to authentication state reactively
 */
export function useAuthStore(): AuthState {
  return useSyncExternalStore(
    (callback) => authStore.subscribe(callback),
    () => authStore.getState(),
    () => authStore.getState()
  );
}
