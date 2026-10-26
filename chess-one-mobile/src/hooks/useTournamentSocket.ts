import { useEffect, useRef } from 'react';
import { gameSocket } from '../socket/game.socket';
import type {
  RoundStartedEvent,
  YourGameEvent,
  TournamentUpdatedEvent,
} from '../types/tournament.types';

export interface TournamentSocketHandlers {
  onRoundStarted?: (event: RoundStartedEvent) => void;
  onYourGame?: (event: YourGameEvent) => void;
  onUpdated?: (event: TournamentUpdatedEvent) => void;
  onTournamentUpdated?: (event: TournamentUpdatedEvent) => void;
}

export function useTournamentSocket(
  tournamentId: number | null | undefined,
  handlers: TournamentSocketHandlers = {}
) {
  const handlersRef = useRef(handlers);
  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!tournamentId || Number.isNaN(Number(tournamentId))) return;

    const id = Number(tournamentId);
    gameSocket.joinTournament(id);

    const unsubRoundStarted = gameSocket.onRoundStarted((event) => {
      if (Number(event.tournamentId) === id) {
        handlersRef.current.onRoundStarted?.(event);
      }
    });

    const unsubYourGame = gameSocket.onYourGame((event) => {
      if (Number(event.tournamentId) === id) {
        handlersRef.current.onYourGame?.(event);
      }
    });

    const unsubUpdated = gameSocket.onTournamentUpdated((event) => {
      if (Number(event.tournamentId) === id) {
        handlersRef.current.onUpdated?.(event);
        handlersRef.current.onTournamentUpdated?.(event);
      }
    });

    return () => {
      unsubRoundStarted();
      unsubYourGame();
      unsubUpdated();
      gameSocket.leaveTournament(id);
    };
  }, [tournamentId]);
}
