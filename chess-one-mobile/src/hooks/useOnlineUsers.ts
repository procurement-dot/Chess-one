import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services/game.service';
import { OnlineUser } from '../types/game.types';
import { gameSocket } from '../socket/game.socket';
import { useAuthStore } from '../store/authStore';

export function useOnlineUsers(enabled: boolean = true) {
  const { chessOneToken } = useAuthStore();
  const isAuthorized = enabled && Boolean(chessOneToken);

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await gameService.getUsers();
      setUsers(data);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setError(err.userFriendlyMessage || err.message || 'Failed to load players');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      setUsers([]);
      return;
    }

    fetchUsers();

    // Listen to real-time online socket updates
    const unsubOnline = gameSocket.onOnlineUsersUpdate((onlineIds: number[]) => {
      const onlineSet = new Set(onlineIds.map((id) => Number(id)));
      setUsers((prev) =>
        prev
          .map((u) => ({
            ...u,
            isOnline: onlineSet.has(u.id),
          }))
          .sort((a, b) => {
            if (a.isOnline === b.isOnline) return a.name.localeCompare(b.name);
            return a.isOnline ? -1 : 1;
          })
      );
    });

    // Periodic refresh every 10s
    const timer = setInterval(fetchUsers, 10000);

    return () => {
      unsubOnline();
      clearInterval(timer);
    };
  }, [isAuthorized, fetchUsers]);

  const onlineCount = users.filter((u) => u.isOnline).length;

  return {
    users,
    onlineCount,
    isLoading,
    error,
    refresh: fetchUsers,
  };
}
