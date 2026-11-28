import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getTournaments } from '../services/tournament.service';
import type { TournamentListItem, TournamentListQuery } from '../types/tournament.types';

export type TournamentFilter = 'ACTIVE' | 'UPCOMING' | 'MINE';

export function useTournaments(filter: TournamentFilter = 'UPCOMING') {
  const [tournaments, setTournaments] = useState<TournamentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTournaments = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const query: TournamentListQuery = {};
      if (filter === 'ACTIVE') query.status = 'ACTIVE';
      else if (filter === 'UPCOMING') query.status = 'UPCOMING';
      else if (filter === 'MINE') query.mine = true;

      try {
        const res = await getTournaments(query);
        setTournaments(res.tournaments);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load tournaments');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [filter]
  );

  useFocusEffect(
    useCallback(() => {
      fetchTournaments(false);
    }, [fetchTournaments])
  );

  const refresh = useCallback(() => {
    return fetchTournaments(true);
  }, [fetchTournaments]);

  return {
    tournaments,
    loading,
    refreshing,
    error,
    refresh,
  };
}
