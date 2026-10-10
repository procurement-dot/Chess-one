import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LearnState {
  completedLevels: Record<number, number>; // levelId -> stars
  questProgress: Record<string, number>;
  collectedRewards: string[];
  coachPersonality: 'Playful' | 'Calm';
}

const STORAGE_KEY = '@chessone_learn_state';

const defaultState: LearnState = {
  completedLevels: { 1: 3, 2: 3, 3: 2 }, // Sample starting data
  questProgress: { q1: 1, q2: 0, q3: 0 },
  collectedRewards: [],
  coachPersonality: 'Playful',
};

class LearnStore {
  private state: LearnState = defaultState;
  private listeners: Set<() => void> = new Set();
  private isLoaded: boolean = false;

  constructor() {
    this.loadState();
  }

  private async loadState() {
    if (typeof window === 'undefined') {
      this.isLoaded = true;
      return;
    }
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.state = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load learn state:', e);
    } finally {
      this.isLoaded = true;
      this.notify();
    }
  }

  private async saveState() {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.warn('Failed to save learn state:', e);
    }
    this.notify();
  }

  getState() {
    return this.state;
  }

  getIsLoaded() {
    return this.isLoaded;
  }

  completeLevel(levelId: number, stars: number) {
    const existing = this.state.completedLevels[levelId] || 0;
    if (stars > existing) {
      this.state.completedLevels = { ...this.state.completedLevels, [levelId]: stars };
      this.saveState();
    }
  }

  collectReward(questId: string) {
    if (!this.state.collectedRewards.includes(questId)) {
      this.state.collectedRewards = [...this.state.collectedRewards, questId];
      this.saveState();
    }
  }

  setCoachPersonality(p: 'Playful' | 'Calm') {
    this.state.coachPersonality = p;
    this.saveState();
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

export const learnStore = new LearnStore();

export function useLearnStore(): LearnState {
  return useSyncExternalStore(
    (callback) => learnStore.subscribe(callback),
    () => learnStore.getState(),
    () => learnStore.getState()
  );
}
