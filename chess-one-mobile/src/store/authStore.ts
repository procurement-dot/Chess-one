import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, GoogleUser } from '../types/auth.types';
import { UserRole } from '../types/class.types';
import { getApiBaseUrl } from '../services/apiClient';
import { classStore } from './classStore';

type Listener = () => void;

const STORAGE_TOKEN_KEY = 'chess_one_token';
const STORAGE_USER_KEY = 'chess_one_user';
const STORAGE_GOOGLE_KEY = 'chess_one_google_token';

let onLogoutCallback: (() => void) | null = null;

export function setOnLogout(cb: () => void) {
  onLogoutCallback = cb;
}

function getStoredString(key: string): string | null {
  try {
    if (typeof window !== 'undefined') {
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

export function extractUserFromToken(token: string | null): { id: string; email?: string } | null {
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
      // If cached user has no role, treat as "PLAYER"
      if (!user.role) {
        user.role = 'PLAYER';
      }
      return user;
    }
    if (tokenUser) {
      return {
        id: tokenUser.id,
        email: tokenUser.email || '',
        name: tokenUser.email?.split('@')[0] || `Player ${tokenUser.id}`,
        role: 'PLAYER',
      };
    }
    return user;
  } catch {}
  return null;
}

export interface ExtendedAuthState extends AuthState {
  isCoach: boolean;
  isAdmin: boolean;
  loginAsDemoUser: (role?: 'COACH' | 'PLAYER' | 'ADMIN') => void;
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
  private hasSyncedWithMe = false;

  constructor() {
    // If token exists on app start, sync profile with backend /api/auth/me
    if (typeof window !== 'undefined' || typeof setTimeout !== 'undefined') {
      setTimeout(() => {
        this.syncCurrentUser();
      }, 0);
    }
  }

  getState(): AuthState {
    return this.state;
  }

  get isCoach(): boolean {
    const role = this.state.user?.role || 'PLAYER';
    return role === 'COACH' || role === 'ADMIN';
  }

  get isAdmin(): boolean {
    return this.state.user?.role === 'ADMIN';
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

  /**
   * Sync user profile from backend GET /api/auth/me on app start
   * 200 -> update user (with role) in store + storage
   * 401 -> logout
   * network error -> keep cached user
   */
  async syncCurrentUser(): Promise<void> {
    const token = this.state.chessOneToken || getStoredString(STORAGE_TOKEN_KEY);
    if (!token) return;

    try {
      const url = `${getApiBaseUrl()}/api/auth/me`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (res.status === 200) {
        const json = await res.json();
        const serverUser = json.data?.user || json.user;
        if (serverUser) {
          const role: UserRole = serverUser.role || 'PLAYER';
          this.updateUser({
            id: String(serverUser.id),
            name: serverUser.name,
            email: serverUser.email,
            photo: serverUser.avatarUrl || this.state.user?.photo,
            role,
          });
          this.hasSyncedWithMe = true;
        }
      } else if (res.status === 401) {
        this.clearAuth();
      }
    } catch {
      // Network error -> keep cached user
    }
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
    const token = chessOneToken || idToken || this.state.chessOneToken;
    let finalUser = user || this.state.user;
    const tokenUser = extractUserFromToken(token);
    if (tokenUser && finalUser) {
      finalUser = {
        ...finalUser,
        id: tokenUser.id,
        email: finalUser.email || tokenUser.email,
        role: finalUser.role || 'PLAYER',
      };
    } else if (finalUser && !finalUser.role) {
      finalUser = {
        ...finalUser,
        role: 'PLAYER',
      };
    }

    if (token) setStoredString(STORAGE_TOKEN_KEY, token);
    if (finalUser) setStoredString(STORAGE_USER_KEY, JSON.stringify(finalUser));
    if (idToken) setStoredString(STORAGE_GOOGLE_KEY, idToken);

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
    const current = this.state.user || {
      id: '',
      email: '',
      name: '',
      role: 'PLAYER',
    };
    const updated: GoogleUser = {
      ...current,
      ...partial,
      role: partial.role || current.role || 'PLAYER',
    };
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
      updatedUser = {
        ...updatedUser,
        id: tokenUser.id,
        email: updatedUser.email || tokenUser.email,
        role: updatedUser.role || 'PLAYER',
      };
    } else if (tokenUser && !updatedUser) {
      updatedUser = {
        id: tokenUser.id,
        email: tokenUser.email || '',
        name: tokenUser.email?.split('@')[0] || `Player ${tokenUser.id}`,
        role: 'PLAYER',
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
    try {
      AsyncStorage.removeItem(STORAGE_TOKEN_KEY).catch(() => {});
      AsyncStorage.removeItem(STORAGE_USER_KEY).catch(() => {});
      AsyncStorage.removeItem(STORAGE_GOOGLE_KEY).catch(() => {});
      AsyncStorage.removeItem('@chessone_user').catch(() => {});
    } catch {}

    // Reset class module store cleanly
    try {
      classStore.reset();
    } catch {}

    // Disconnect socket cleanly on logout
    if (onLogoutCallback) {
      try {
        onLogoutCallback();
      } catch {}
    }

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

  /**
   * Fast 1-click Demo Login for UI/UX testing
   */
  loginAsDemoUser(role: 'COACH' | 'PLAYER' | 'ADMIN' = 'COACH') {
    const demoUser: GoogleUser = {
      id: role === 'COACH' ? '140' : role === 'ADMIN' ? '86' : '1',
      name: role === 'COACH' ? 'Coach One' : role === 'ADMIN' ? 'Admin User' : 'Player One',
      email:
        role === 'COACH'
          ? 'coach1@chessone.local'
          : role === 'ADMIN'
          ? 'admin@chessone.local'
          : 'player1@chessone.local',
      role,
      onboardingDone: true,
      rating: 1200,
      gamesPlayed: 10,
    };

    let b64Payload = '';
    try {
      const json = JSON.stringify({
        userId: Number(demoUser.id),
        email: demoUser.email,
        role: demoUser.role,
      });
      if (typeof window !== 'undefined' && window.btoa) {
        b64Payload = window.btoa(json);
      } else if (typeof (globalThis as any).btoa === 'function') {
        b64Payload = (globalThis as any).btoa(json);
      } else {
        b64Payload = 'eyJ1c2VySWQiOjEsInJvbGUiOiJDT0FDSCJ9';
      }
    } catch {
      b64Payload = 'eyJ1c2VySWQiOjEsInJvbGUiOiJDT0FDSCJ9';
    }

    const mockToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${b64Payload}.demoSignature`;

    this.setGoogleAuth({
      user: demoUser,
      idToken: mockToken,
      chessOneToken: mockToken,
    });
  }
}

export const authStore = new AuthStore();

/**
 * Selectors/helpers
 */
export const isCoach = (user?: GoogleUser | null): boolean => {
  const role = user?.role || 'PLAYER';
  return role === 'COACH' || role === 'ADMIN';
};

export const isAdmin = (user?: GoogleUser | null): boolean => {
  return user?.role === 'ADMIN';
};

/**
 * React hook to subscribe to authentication state reactively
 */
export function useAuthStore(): ExtendedAuthState {
  const state = useSyncExternalStore(
    (callback) => authStore.subscribe(callback),
    () => authStore.getState(),
    () => authStore.getState()
  );

  return {
    ...state,
    isCoach: authStore.isCoach,
    isAdmin: authStore.isAdmin,
    loginAsDemoUser: authStore.loginAsDemoUser.bind(authStore),
  };
}
