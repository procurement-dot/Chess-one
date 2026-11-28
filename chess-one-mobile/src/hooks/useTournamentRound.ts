import { useCallback, useEffect, useState } from 'react';
import { getRound } from '../services/tournament.service';
import { useTournamentSocket } from './useTournamentSocket';
import type { TournamentRound } from '../types/tournament.types';

export function useTournamentRound(
  tournamentId: number | null | undefined,
  roundNumber: number | null | undefined
) {
  const [round, setRound] = useState<TournamentRound | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const refresh = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!tournamentId || !roundNumber || roundNumber < 1) {
      return;
    }

    getRound(Number(tournamentId), roundNumber)
      .then((res) => {
        if (isMounted) {
          setRound(res.round);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Failed to load round';
          setError(msg);
          setRound(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [tournamentId, roundNumber, refreshTrigger]);

  // Live socket updates: if this round was updated or started, re-fetch pairings
  useTournamentSocket(tournamentId, {
    onRoundStarted: useCallback(
      (payload) => {
        if (payload.roundNumber === roundNumber) {
          refresh();
        }
      },
      [roundNumber, refresh]
    ),
    onTournamentUpdated: useCallback(() => {
      refresh();
    }, [refresh]),
  });

  const effectiveRound =
    !tournamentId || !roundNumber || roundNumber < 1 ? null : round;

  return {
    round: effectiveRound,
    loading,
    error,
    refresh,
  };
}
