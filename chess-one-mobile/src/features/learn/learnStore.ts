import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LearnState {
  completedLevels: Record<number, number>; // levelId -> stars (1-3)
  questProgress: Record<string, number>; // questId -> count
  collectedRewards: string[]; // questIds collected
  coachPersonality: 'Playful' | 'Calm';
  coachPracticed: boolean;
  gameReviewed: boolean;
  solvedPuzzles: string[]; // puzzleIds solved
  totalXp: number;
}

const STORAGE_KEY = '@chessone_learn_state_v3';

const defaultState: LearnState = {
  completedLevels: { 1: 3, 2: 3, 3: 2 }, // sample starter progress (Level 4 unlocked)
  questProgress: { q1: 1, q2: 0, q3: 0, q4: 0 },
  collectedRewards: [],
  coachPersonality: 'Playful',
  coachPracticed: false,
  gameReviewed: false,
  solvedPuzzles: [],
  totalXp: 180,
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
        const parsed = JSON.parse(stored);
        this.state = {
          ...defaultState,
          ...parsed,
          completedLevels: { ...defaultState.completedLevels, ...(parsed.completedLevels || {}) },
          questProgress: { ...defaultState.questProgress, ...(parsed.questProgress || {}) },
          solvedPuzzles: Array.isArray(parsed.solvedPuzzles) ? parsed.solvedPuzzles : [],
        };
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

  getState(): LearnState {
    return this.state;
  }

  getIsLoaded(): boolean {
    return this.isLoaded;
  }

  getTotalStars(): number {
    return Object.values(this.state.completedLevels).reduce((acc, stars) => acc + (stars || 0), 0);
  }

  completeLevel(levelId: number, stars: number, xpReward: number = 20) {
    const existingStars = this.state.completedLevels[levelId] || 0;
    const isNewCompletion = !this.state.completedLevels[levelId];

    const updatedLevels = {
      ...this.state.completedLevels,
      [levelId]: Math.max(existingStars, stars),
    };

    const newXp = isNewCompletion ? this.state.totalXp + xpReward : this.state.totalXp;
    const updatedQuests = {
      ...this.state.questProgress,
      q1: Math.min((this.state.questProgress.q1 || 0) + 1, 1),
    };

    this.state = {
      ...this.state,
      completedLevels: updatedLevels,
      totalXp: newXp,
      questProgress: updatedQuests,
    };
    this.saveState();
  }

  recordCoachPractice() {
    this.state = {
      ...this.state,
      coachPracticed: true,
      questProgress: {
        ...this.state.questProgress,
        q2: 1,
      },
      totalXp: this.state.totalXp + 15,
    };
    this.saveState();
  }

  recordGameReview() {
    this.state = {
      ...this.state,
      gameReviewed: true,
      questProgress: {
        ...this.state.questProgress,
        q3: 1,
      },
      totalXp: this.state.totalXp + 25,
    };
    this.saveState();
  }

  recordPuzzleSolved(puzzleId: string, xpReward: number = 30) {
    const isNew = !this.state.solvedPuzzles.includes(puzzleId);
    const updatedList = isNew ? [...this.state.solvedPuzzles, puzzleId] : this.state.solvedPuzzles;
    const newXp = isNew ? this.state.totalXp + xpReward : this.state.totalXp;

    this.state = {
      ...this.state,
      solvedPuzzles: updatedList,
      totalXp: newXp,
      questProgress: {
        ...this.state.questProgress,
        q4: 1,
      },
    };
    this.saveState();
  }

  collectReward(questId: string, xpBonus: number = 50) {
    if (!this.state.collectedRewards.includes(questId)) {
      this.state = {
        ...this.state,
        collectedRewards: [...this.state.collectedRewards, questId],
        totalXp: this.state.totalXp + xpBonus,
      };
      this.saveState();
    }
  }

  setCoachPersonality(p: 'Playful' | 'Calm') {
    this.state = {
      ...this.state,
      coachPersonality: p,
    };
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
    () => defaultState
  );
}
