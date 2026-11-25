import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services/game.service';
import { OnlineUser } from '../types/game.types';
import { gameSocket } from '../socket/game.socket';
import { useAuthStore } from '../store/authStore';

export function useOnlineUsers(enabled: boolean = true) {
  const isAuthorized = enabled;

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

    // Listen to real-time online socket updates and update in-place without full re-fetch
    const unsubOnline = gameSocket.onOnlineUsersUpdate((onlineUserIds: number[]) => {
      const onlineSet = new Set(onlineUserIds.map((id) => Number(id)));
      setUsers((prev) =>
        prev.map((u) => ({
          ...u,
          isOnline: onlineSet.has(Number(u.id)),
        }))
      );
    });

    // Periodic refresh every 20s to capture newly registered users
    const timer = setInterval(fetchUsers, 20000);

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
