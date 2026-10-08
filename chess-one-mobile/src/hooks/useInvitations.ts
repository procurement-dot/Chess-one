import { useState, useEffect, useCallback } from 'react';
import { gameService } from '../services/game.service';
import { GameInvitation, Game } from '../types/game.types';
import { useAuthStore } from '../store/authStore';

export function useInvitations(enabled: boolean = true) {
  const { chessOneToken } = useAuthStore();
  const isAuthorized = enabled && Boolean(chessOneToken);

  const [invitations, setInvitations] = useState<GameInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async () => {
    if (!isAuthorized) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await gameService.getInvitations();
      setInvitations(data || []);
    } catch (err: any) {
      if (err.response?.status !== 401) {
        setError(err.userFriendlyMessage || err.message || 'Failed to load invitations');
      }
    } finally {
      setIsLoading(false);
    }
  }, [isAuthorized]);

  useEffect(() => {
    if (!isAuthorized) {
      setInvitations([]);
      return;
    }

    fetchInvitations();

    // Periodic refresh every 10s
    const interval = setInterval(fetchInvitations, 10000);
    return () => clearInterval(interval);
  }, [isAuthorized, fetchInvitations]);

  const accept = async (invitationId: number): Promise<Game | null> => {
    setProcessingId(invitationId);
    try {
      const game = await gameService.acceptInvitation(invitationId);
      // Remove accepted invite from list immediately
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      return game;
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Failed to accept invitation');
      return null;
    } finally {
      setProcessingId(null);
    }
  };

  const decline = async (invitationId: number): Promise<boolean> => {
    setProcessingId(invitationId);
    try {
      await gameService.declineInvitation(invitationId);
      setInvitations((prev) => prev.filter((inv) => inv.id !== invitationId));
      return true;
    } catch (err: any) {
      setError(err.userFriendlyMessage || err.message || 'Failed to decline invitation');
      return false;
    } finally {
      setProcessingId(null);
    }
  };

  return {
    invitations,
    pendingCount: invitations.length,
    isLoading,
    processingId,
    error,
    refresh: fetchInvitations,
    accept,
    decline,
    acceptInvitation: accept,
    declineInvitation: decline,
  };
}
