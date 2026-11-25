import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services/game.service';
import { OnlineUser } from '../types/game.types';
import { gameSocket } from '../socket/game.socket';

export type OnlineUsersStatus = 'idle' | 'loading' | 'success' | 'error';

export function useOnlineUsers(enabled: boolean = true) {
  const isAuthorized = enabled;

  const [users, setUsers] = useState<OnlineUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<OnlineUsersStatus>('idle');

  const fetchUsers = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      setIsLoading(true);
      setError(null);
      setStatus('loading');
      const data = await gameService.getUsers();
      setUsers(data);
      setStatus('success');
    } catch (err: any) {
      const msg = err.userFriendlyMessage || err.message || 'Failed to load players';
      setError(msg);
      setStatus('error');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      setUsers([]);
      setStatus('idle');
      return;
    }

    fetchUsers();

    // Listen to real-time online socket updates and merge newly active users immediately
    const unsubOnline = gameSocket.onOnlineUsersUpdate(
      (onlineUserIds: number[], onlineUsers?: OnlineUser[]) => {
        const onlineSet = new Set(onlineUserIds.map((id) => Number(id)));
        setUsers((prev) => {
          const map = new Map<number, OnlineUser>();

          for (const u of prev) {
            map.set(Number(u.id), {
              ...u,
              isOnline: onlineSet.has(Number(u.id)),
            });
          }

          if (onlineUsers && Array.isArray(onlineUsers)) {
            for (const ou of onlineUsers) {
              const numId = Number(ou.id);
              if (map.has(numId)) {
                map.set(numId, { ...map.get(numId)!, ...ou, isOnline: true });
              } else {
                map.set(numId, { ...ou, isOnline: true });
              }
            }
          }

          return Array.from(map.values());
        });
      }
    );

    // Automatically refetch users when the socket reconnects
    const unsubReconnect = gameSocket.onReconnected(() => {
      fetchUsers();
    });

    // Refetch when page becomes visible on mobile web (switching back from lock/browser tab)
    let handleVisibility: (() => void) | null = null;
    if (typeof document !== 'undefined') {
      handleVisibility = () => {
        if (document.visibilityState === 'visible') {
          fetchUsers();
        }
      };
      document.addEventListener('visibilitychange', handleVisibility);
    }

    // Periodic refresh every 20s to capture newly registered users
    const timer = setInterval(fetchUsers, 20000);

    return () => {
      unsubOnline();
      unsubReconnect();
      if (handleVisibility && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      clearInterval(timer);
    };
  }, [isAuthorized, fetchUsers]);

  const onlineCount = users.filter((u) => u.isOnline).length;

  return {
    users,
    onlineCount,
    isLoading,
    error,
    status,
    refresh: fetchUsers,
  };
}
