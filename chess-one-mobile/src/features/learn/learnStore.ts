import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface PlacementGameResult {
  gameNumber: number;
  won: boolean;
  accuracy: number;
  moves: number;
  blunders: number;
}

export interface LearnState {
  completedLevels: Record<number, number>; // levelId -> stars (1-3)
  questProgress: Record<string, number>; // questId -> count
  collectedRewards: string[]; // questIds collected
  coachPersonality: 'Playful' | 'Calm';
  coachPracticed: boolean;
  gameReviewed: boolean;
  solvedPuzzles: string[]; // puzzleIds solved
  totalXp: number;
  tacticalRating: number; // student's adaptive tactical ELO (default: 1000)
  // 5-Game AI Placement Assessment
  isPlacementComplete: boolean;
  placementGamesCompleted: number; // 0 to 5
  placementHistory: PlacementGameResult[];
  placementTier: 'Beginner' | 'Pre-Intermediate' | 'Intermediate' | 'Advance' | null;
  startingLevelId: number; // e.g. 1, 6, 11, 21
}

const STORAGE_KEY = '@chessone_learn_state_v3';

const defaultState: LearnState = {
  completedLevels: { 1: 0 }, // Uncompleted until placed
  questProgress: { q1: 0, q2: 0, q3: 0, q4: 0 },
  collectedRewards: [],
  coachPersonality: 'Playful',
  coachPracticed: false,
  gameReviewed: false,
  solvedPuzzles: [],
  totalXp: 180,
  tacticalRating: 1000,
  isPlacementComplete: false,
  placementGamesCompleted: 0,
  placementHistory: [],
  placementTier: null,
  startingLevelId: 1,
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
          tacticalRating: typeof parsed.tacticalRating === 'number' ? parsed.tacticalRating : 1000,
          isPlacementComplete: !!parsed.isPlacementComplete,
          placementGamesCompleted: typeof parsed.placementGamesCompleted === 'number' ? parsed.placementGamesCompleted : 0,
          placementHistory: Array.isArray(parsed.placementHistory) ? parsed.placementHistory : [],
          placementTier: parsed.placementTier || null,
          startingLevelId: typeof parsed.startingLevelId === 'number' ? parsed.startingLevelId : 1,
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

  recordPuzzleSolved(puzzleId: string, xpReward: number = 30, ratingDelta: number = 0) {
    const isNew = !this.state.solvedPuzzles.includes(puzzleId);
    const updatedList = isNew ? [...this.state.solvedPuzzles, puzzleId] : this.state.solvedPuzzles;
    const newXp = isNew ? this.state.totalXp + xpReward : this.state.totalXp;
    const newRating = Math.max(500, Math.min(2600, this.state.tacticalRating + ratingDelta));

    this.state = {
      ...this.state,
      solvedPuzzles: updatedList,
      totalXp: newXp,
      tacticalRating: newRating,
      questProgress: {
        ...this.state.questProgress,
        q4: 1,
      },
    };
    this.saveState();
  }

  updateTacticalRating(delta: number) {
    const newRating = Math.max(500, Math.min(2600, this.state.tacticalRating + delta));
    this.state = {
      ...this.state,
      tacticalRating: newRating,
    };
    this.saveState();
    return newRating;
  }

  setTacticalRating(rating: number) {
    const clamped = Math.max(500, Math.min(2600, rating));
    this.state = {
      ...this.state,
      tacticalRating: clamped,
    };
    this.saveState();
    return clamped;
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

  recordPlacementGame(won: boolean, accuracy: number, moves: number = 15, blunders: number = 0) {
    const nextGameNum = this.state.placementGamesCompleted + 1;
    const newHistory: PlacementGameResult[] = [
      ...this.state.placementHistory,
      { gameNumber: nextGameNum, won, accuracy, moves, blunders },
    ];
    const gamesCompleted = Math.min(5, nextGameNum);

    this.state = {
      ...this.state,
      placementGamesCompleted: gamesCompleted,
      placementHistory: newHistory,
      totalXp: this.state.totalXp + 35,
    };

    if (gamesCompleted >= 5) {
      this.evaluatePlacement();
    } else {
      this.saveState();
    }
  }

  evaluatePlacement() {
    const history = this.state.placementHistory;
    const avgAccuracy = history.length > 0
      ? Math.round(history.reduce((sum, g) => sum + g.accuracy, 0) / history.length)
      : 70;
    const wins = history.filter((g) => g.won).length;

    let tier: 'Beginner' | 'Pre-Intermediate' | 'Intermediate' | 'Advance' = 'Beginner';
    let rating = 750;
    let startLevel = 1;
    const autoCompletedLevels: Record<number, number> = {};

    if (avgAccuracy >= 82 || wins >= 4) {
      tier = 'Advance';
      rating = 1450;
      startLevel = 21;
      for (let i = 1; i <= 20; i++) {
        autoCompletedLevels[i] = 3;
      }
    } else if (avgAccuracy >= 68 || wins >= 3) {
      tier = 'Intermediate';
      rating = 1180;
      startLevel = 11;
      for (let i = 1; i <= 10; i++) {
        autoCompletedLevels[i] = 3;
      }
    } else if (avgAccuracy >= 52 || wins >= 2) {
      tier = 'Pre-Intermediate';
      rating = 950;
      startLevel = 6;
      for (let i = 1; i <= 5; i++) {
        autoCompletedLevels[i] = 3;
      }
    } else {
      tier = 'Beginner';
      rating = 750;
      startLevel = 1;
      autoCompletedLevels[1] = 0;
    }

    this.state = {
      ...this.state,
      isPlacementComplete: true,
      placementTier: tier,
      tacticalRating: rating,
      startingLevelId: startLevel,
      completedLevels: {
        ...this.state.completedLevels,
        ...autoCompletedLevels,
      },
      totalXp: this.state.totalXp + 150,
    };
    this.saveState();
  }

  resetPlacement() {
    this.state = {
      ...this.state,
      isPlacementComplete: false,
      placementGamesCompleted: 0,
      placementHistory: [],
      placementTier: null,
      startingLevelId: 1,
      completedLevels: { 1: 0 },
    };
    this.saveState();
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
