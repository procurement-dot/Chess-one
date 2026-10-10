import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'Student' | 'Parent' | 'Coach' | 'School' | 'Organiser';

const ROLE_STORAGE_KEY = '@chessone_user_role';

class RoleStore {
  private role: UserRole = 'Student';
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
      if (savedRole && ['Student', 'Parent', 'Coach', 'School', 'Organiser'].includes(savedRole)) {
        this.role = savedRole as UserRole;
      }
    } catch (e) {
      console.warn('Failed to load role:', e);
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  getRole() {
    return this.role;
  }

  getIsLoaded() {
    return this.isLoaded;
  }

  async setRole(newRole: UserRole) {
    this.role = newRole;
    this.notify();
    try {
      await AsyncStorage.setItem(ROLE_STORAGE_KEY, newRole);
    } catch (e) {
      console.warn('Failed to save role:', e);
    }
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
