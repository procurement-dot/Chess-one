import { useCallback, useState, useEffect, useRef } from 'react';
import {
  getTournament,
  joinTournament,
  leaveTournament,
  cancelTournament,
  startTournament,
  getMyGame,
} from '../services/tournament.service';
import { friendlyTournamentError } from '../utils/tournament.utils';
import { useTournamentSocket } from './useTournamentSocket';
import type { TournamentDetails, MyGame } from '../types/tournament.types';

export function useTournament(id: number | null | undefined) {
  const [data, setData] = useState<TournamentDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(id && !Number.isNaN(Number(id))));
  const [error, setError] = useState<string | null>(
    !id || Number.isNaN(Number(id)) ? 'Invalid tournament ID' : null
  );
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [myGame, setMyGame] = useState<MyGame | null>(null);
  const [roundBanner, setRoundBanner] = useState<{ roundNumber: number } | null>(null);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setBannerWithTimeout = useCallback((banner: { roundNumber: number } | null) => {
    if (bannerTimerRef.current) {
      clearTimeout(bannerTimerRef.current);
      bannerTimerRef.current = null;
    }
    setRoundBanner(banner);
    if (banner) {
      bannerTimerRef.current = setTimeout(() => {
        setRoundBanner(null);
      }, 8000);
    }
  }, []);

  const dismissRoundBanner = useCallback(() => {
    setBannerWithTimeout(null);
  }, [setBannerWithTimeout]);

  // Clean up banner timer on unmount
  useEffect(() => {
    return () => {
      if (bannerTimerRef.current) {
        clearTimeout(bannerTimerRef.current);
      }
    };
  }, []);

  const fetchMyGame = useCallback(async () => {
    if (!id || Number.isNaN(Number(id))) return;
    try {
      const res = await getMyGame(Number(id));
      setMyGame(res);
    } catch {
      // 404 NOT_IN_TOURNAMENT is expected if user is not a participant
      setMyGame(null);
    }
  }, [id]);

  const fetchDetails = useCallback(async () => {
    if (!id || Number.isNaN(Number(id))) {
      setError('Invalid tournament ID');
      setLoading(false);
      return;
    }
    try {
      const details = await getTournament(Number(id));
      setData(details);
      setError(null);
      if (details.isPlayer && details.tournament.status === 'ACTIVE') {
        fetchMyGame();
      } else {
        setMyGame(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Tournament not found';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [id, fetchMyGame]);

  // Initial load
  useEffect(() => {
    let isMounted = true;
    if (!id || Number.isNaN(Number(id))) {
      return;
    }

    getTournament(Number(id))
      .then((details) => {
        if (isMounted) {
          setData(details);
          setError(null);
          if (details.isPlayer && details.tournament.status === 'ACTIVE') {
            getMyGame(Number(id))
              .then((game) => {
                if (isMounted) setMyGame(game);
              })
              .catch(() => {
                if (isMounted) setMyGame(null);
              });
          }
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          const msg = err instanceof Error ? err.message : 'Tournament not found';
          setError(msg);
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
  }, [id]);

  // Socket integration for live updates
  useTournamentSocket(id, {
    onUpdated: () => {
      fetchDetails();
    },
    onRoundStarted: (event) => {
      fetchDetails();
      setBannerWithTimeout({ roundNumber: event.roundNumber });
    },
    onYourGame: (event) => {
      if (event.bye) {
        setMyGame({
          roundNumber: event.roundNumber,
          bye: true,
          gameId: null,
        });
      } else if (event.gameId && event.color && event.opponent && event.boardNumber) {
        setMyGame({
          roundNumber: event.roundNumber,
          boardNumber: event.boardNumber,
          gameId: event.gameId,
          gameCode: '',
          color: event.color,
          opponent: event.opponent,
          gameStatus: 'ACTIVE',
        });
        fetchMyGame();
      }
    },
  });

  const start = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await startTournament(Number(id));
      setData(updated);
      if (updated.isPlayer && updated.tournament.status === 'ACTIVE') {
        fetchMyGame();
      }
      return updated;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const friendly = friendlyTournamentError(code);
      setActionError(friendly);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [id, fetchMyGame]);

  const join = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await joinTournament(Number(id));
      setData(updated);
      return updated;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const friendly = friendlyTournamentError(code);
      setActionError(friendly);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  const leave = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await leaveTournament(Number(id));
      setData(updated);
      setMyGame(null);
      return updated;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const friendly = friendlyTournamentError(code);
      setActionError(friendly);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  const cancel = useCallback(async () => {
    if (!id) return;
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await cancelTournament(Number(id));
      setData(updated);
      return updated;
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code;
      const friendly = friendlyTournamentError(code);
      setActionError(friendly);
      throw err;
    } finally {
      setActionLoading(false);
    }
  }, [id]);

  return {
    data,
    loading,
    error,
    refresh: fetchDetails,
    start,
    join,
    leave,
    cancel,
    actionLoading,
    actionError,
    myGame,
    roundBanner,
    dismissRoundBanner,
  };
}
