import { useEffect } from 'react';
import { gameSocket } from '../socket/game.socket';

/**
 * Hook to manage Socket.IO room lifecycle for a game
 */
export function useGameSocket(gameId?: number | string | null) {
  useEffect(() => {
    if (!gameId) return;

    gameSocket.joinGame(gameId);

    return () => {
      gameSocket.leaveGame(gameId);
    };
  }, [gameId]);
}
