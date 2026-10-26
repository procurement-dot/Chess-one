import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BackendRole } from '../../types/auth.types';
import { toAppRole } from '../../utils/role.utils';

export type UserRole = 'Student' | 'Coach' | 'School' | 'Organizer' | 'Organiser';

export const ALLOWED_ROLES: UserRole[] = ['Student', 'Coach', 'School', 'Organizer'];

const ROLE_STORAGE_KEY = 'chess_one_role';

function getInitialRole(): UserRole {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const saved = window.localStorage.getItem(ROLE_STORAGE_KEY);
      if (saved && (ALLOWED_ROLES.includes(saved as UserRole) || saved === 'Organiser')) {
        return saved === 'Organiser' ? 'Organizer' : (saved as UserRole);
      }
      const savedUser = window.localStorage.getItem('chess_one_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed?.role) {
          return toAppRole(parsed.role);
        }
      }
    } catch {}
  }
  return 'Student';
}

class RoleStore {
  private role: UserRole = getInitialRole();
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.loadRole();
  }

  private async loadRole() {
    if (typeof window === 'undefined') {
      this.isLoaded = true;
      return;
    }
    try {
      const savedRole = await AsyncStorage.getItem(ROLE_STORAGE_KEY);
      if (savedRole && ALLOWED_ROLES.includes(savedRole as UserRole)) {
        this.role = savedRole as UserRole;
      } else {
        // If nothing was saved in AsyncStorage, keep current (which might have come from localStorage/chess_one_user)
        if (!this.role) {
          this.role = 'Student';
        }
      }
    } catch (e) {
      console.warn('Failed to load role:', e);
      if (!this.role) {
        this.role = 'Student';
      }
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  getRole(): UserRole {
    // Normalise Organiser -> Organizer for consistency
    if (this.role === 'Organiser') return 'Organizer';
    return this.role;
  }

  getIsLoaded() {
    return this.isLoaded;
  }

  async setRole(newRole: UserRole) {
    const normalised = (newRole === 'Organiser' ? 'Organizer' : newRole);
    if (!ALLOWED_ROLES.includes(normalised)) {
      this.role = 'Student';
    } else {
      this.role = normalised;
    }
    this.notify();

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(ROLE_STORAGE_KEY, this.role);
      } catch {}
    }

    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, this.role);
    } catch (e) {
      console.warn('Failed to save role:', e);
    }
  }

  syncFromServer(role: BackendRole) {
    const mapped = toAppRole(role);
    this.setRole(mapped);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }
}

export const roleStore = new RoleStore();

export function useRoleStore(): UserRole {
  return useSyncExternalStore(
    (callback) => roleStore.subscribe(callback),
    () => roleStore.getRole(),
    () => roleStore.getRole()
  );
}
