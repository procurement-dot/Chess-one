import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { gameSocket } from '../../socket/game.socket';
import { gameService } from '../../services/game.service';
import { authStore, useAuthStore } from '../../store/authStore';
import { gameStore } from '../../store/gameStore';
import { GameInvitation } from '../../types/game.types';
import { IncomingChallengeModal } from './IncomingChallengeModal';
import { MatchStartVsModal } from './MatchStartVsModal';

export function GlobalInvitationWatcher() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  const [incomingInvitation, setIncomingInvitation] = useState<GameInvitation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [vsModalData, setVsModalData] = useState<{
    gameId: number | string;
    whitePlayerName: string;
    blackPlayerName: string;
    whitePlayerAvatar?: string | null;
    blackPlayerAvatar?: string | null;
    timeControl: string;
  } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setIncomingInvitation(null);
      return;
    }

    // 1. Real-time socket listener for incoming match challenges
    const unsubInv = gameSocket.onInvitationReceived((payload: any) => {
      console.log('[GlobalInvitationWatcher] Live match challenge received via socket:', payload);
      const invId = payload.id || payload.invitationId;
      if (!invId) return;

      const normInv: GameInvitation = {
        id: invId,
        gameId: payload.gameId,
        timeControl: payload.timeControl || '5+0',
        status: 'PENDING',
        sender: payload.sender,
        createdAt: payload.createdAt || new Date().toISOString(),
        expiresAt: payload.expiresAt,
      };
      setIncomingInvitation(normInv);
    });

    // 2. Fast polling fallback to catch pending invitations (e.g. if socket packet was dropped)
    const checkPendingInvitations = async () => {
      if (incomingInvitation || (pathname && pathname.startsWith('/game/'))) {
        return;
      }
      try {
        const invs = await gameService.getInvitations();
        if (invs && invs.length > 0) {
          const first = invs[0];
          setIncomingInvitation((prev) => {
            if (!prev) return first;
            return prev;
          });
        }
      } catch {}
    };

    checkPendingInvitations();
    const interval = setInterval(checkPendingInvitations, 3000);

    return () => {
      unsubInv();
      clearInterval(interval);
    };
  }, [isAuthenticated, pathname, incomingInvitation]);

  const handleAccept = async (invitationId: number) => {
    setIsProcessing(true);
    try {
      const res = await gameService.acceptInvitation(invitationId);
      setIncomingInvitation(null);

      const targetGameId = (res as any)?.gameId || (res as any)?.id;
      const currentUser = authStore.getState().user;
      const myName = currentUser?.name || 'You';
      const oppName =
        (res as any)?.whitePlayer?.name ||
        (res as any)?.blackPlayer?.name ||
        incomingInvitation?.sender?.name ||
        'Opponent';

      const playerColor = (res as any)?.playerColor || 'BLACK';
      const whiteName = playerColor === 'WHITE' ? myName : oppName;
      const blackName = playerColor === 'BLACK' ? myName : oppName;

      try {
        if (typeof window !== 'undefined' && window.sessionStorage && targetGameId) {
          window.sessionStorage.setItem(`chess_game_color_${targetGameId}`, playerColor);
        }
      } catch {}

      setVsModalData({
        gameId: targetGameId,
        whitePlayerName: (res as any)?.whitePlayer?.name || whiteName,
        blackPlayerName: (res as any)?.blackPlayer?.name || blackName,
        whitePlayerAvatar: (res as any)?.whitePlayer?.avatarUrl || null,
        blackPlayerAvatar: (res as any)?.blackPlayer?.avatarUrl || null,
        timeControl: (res as any)?.timeControl || incomingInvitation?.timeControl || '5+0',
      });
    } catch (err: any) {
      Alert.alert(
        'Match Challenge',
        err.userFriendlyMessage || err.message || 'Could not accept challenge. The game may have expired.'
      );
      setIncomingInvitation(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async (invitationId: number) => {
    setIsProcessing(true);
    try {
      await gameService.declineInvitation(invitationId);
    } catch {} finally {
      setIncomingInvitation(null);
      setIsProcessing(false);
    }
  };

  // Do not overlay invitation prompts if user is already playing inside /game/[gameId]
  if (pathname && pathname.startsWith('/game/')) {
    return null;
  }

  return (
    <>
      <IncomingChallengeModal
        visible={Boolean(incomingInvitation)}
        invitation={incomingInvitation}
        isProcessing={isProcessing}
        onAccept={handleAccept}
        onDecline={handleDecline}
        onDismiss={() => setIncomingInvitation(null)}
      />

      {vsModalData && (
        <MatchStartVsModal
          visible={Boolean(vsModalData)}
          gameId={vsModalData.gameId}
          whitePlayerName={vsModalData.whitePlayerName}
          blackPlayerName={vsModalData.blackPlayerName}
          whitePlayerAvatar={vsModalData.whitePlayerAvatar}
          blackPlayerAvatar={vsModalData.blackPlayerAvatar}
          timeControl={vsModalData.timeControl}
          durationMs={2000}
          onComplete={() => {
            const gId = vsModalData.gameId;
            setVsModalData(null);
            gameStore.reset();
            router.replace(`/game/${gId}` as any);
          }}
        />
      )}
    </>
  );
}
