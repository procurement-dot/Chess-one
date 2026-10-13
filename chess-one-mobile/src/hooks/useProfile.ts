import { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '../types/auth.types';
import { userService } from '../services/user.service';
import { authStore, useAuthStore } from '../store/authStore';
import { roleStore } from '../features/roles/roleStore';

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const authState = useAuthStore();
  const isAuthenticated = authState.isAuthenticated;

  const refresh = useCallback(async () => {
    if (!authStore.getState().isAuthenticated) {
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await userService.getMyProfile();
      setProfile(data);
      authStore.updateUser({
        role: data.role,
        rating: data.rating,
        gamesPlayed: data.gamesPlayed,
        onboardingDone: data.onboardingDone,
      });
      roleStore.syncFromServer(data.role);
    } catch (err: unknown) {
      const errObj = err as { userFriendlyMessage?: string; message?: string };
      const msg = errObj?.userFriendlyMessage || errObj?.message || 'Failed to fetch user profile';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      if (cancelled) return;
      if (isAuthenticated) {
        await refresh();
      } else {
        setProfile(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, refresh]);

  return {
    profile,
    loading,
    error,
    refresh,
  };
}
