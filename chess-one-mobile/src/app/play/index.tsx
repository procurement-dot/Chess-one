import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authStore, useAuthStore } from '../../store/authStore';
import { gameStore } from '../../store/gameStore';
import { useInvitations } from '../../hooks/useInvitations';
import { gameSocket } from '../../socket/game.socket';
import { GameInvitation } from '../../types/game.types';
import { IncomingChallengeModal } from '../../components/game/IncomingChallengeModal';
import { MatchStartVsModal } from '../../components/game/MatchStartVsModal';
import { AppFooter } from '../../components/navigation/AppFooter';

export default function PlayHubScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  // Invitations hook
  const {
    invitations,
    isLoading: isLoadingInvites,
    refresh: refreshInvites,
    acceptInvitation,
    declineInvitation,
  } = useInvitations(isAuthenticated);

  // Incoming challenge modal states
  const [incomingModalVisible, setIncomingModalVisible] = useState(false);
  const [incomingInvite, setIncomingInvite] = useState<GameInvitation | null>(null);
  const [isProcessingIncoming, setIsProcessingIncoming] = useState(false);

  // Animated VS popup state
  const [vsModalVisible, setVsModalVisible] = useState(false);
  const [vsModalData, setVsModalData] = useState<{
    gameId: number | string;
    whitePlayerName?: string;
    blackPlayerName?: string;
    whitePlayerAvatar?: string | null;
    blackPlayerAvatar?: string | null;
    timeControl?: string;
  } | null>(null);

  // Connect socket and listen for live incoming challenge notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    gameSocket.connect();

    const unsubInvite = gameSocket.onInvitationReceived((payload: any) => {
      console.log('[PlayHub] New live invitation received via socket:', payload);
      refreshInvites();
      if (payload) {
        setIncomingInvite({
          id: payload.invitationId || payload.id,
          gameId: payload.gameId,
          gameCode: payload.gameCode,
          sender: payload.sender,
          timeControl: payload.timeControl || '5+0',
          createdAt: new Date().toISOString(),
          expiresAt: payload.expiresAt || new Date().toISOString(),
        });
        setIncomingModalVisible(true);
      }
    });

    return () => {
      unsubInvite();
    };
  }, [isAuthenticated, refreshInvites]);

  // Show incoming challenge popup if there are pending invitations
  useEffect(() => {
    if (invitations.length > 0 && !incomingModalVisible) {
      setIncomingInvite(invitations[0]);
      setIncomingModalVisible(true);
    }
  }, [invitations, incomingModalVisible]);

  // Handle accepting incoming challenge
  const handleAcceptInvite = async (invitationId: number) => {
    setIsProcessingIncoming(true);
    try {
      const targetInvite =
        incomingInvite?.id === invitationId
          ? incomingInvite
          : invitations.find((i) => i.id === invitationId);

      const game = await acceptInvitation(invitationId);
      setIncomingModalVisible(false);
      setIncomingInvite(null);

      const gameId = (game as any)?.gameId || game?.id || targetInvite?.gameId;
      if (gameId) {
        const playerColor = (game as any)?.playerColor || 'BLACK';
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(`chess_game_color_${gameId}`, playerColor);
          }
        } catch {}

        // Resolve player names for animated VS faceoff
        const myName = user?.name || user?.email || 'You';
        const opponentName = targetInvite?.sender?.name || targetInvite?.sender?.email || 'Opponent';

        let whiteName = opponentName;
        let blackName = myName;

        if ((game as any)?.whitePlayer?.name && (game as any)?.blackPlayer?.name) {
          whiteName = (game as any).whitePlayer.name;
          blackName = (game as any).blackPlayer.name;
        } else if ((game as any)?.playerColor === 'WHITE') {
          whiteName = myName;
          blackName = opponentName;
        }

        setVsModalData({
          gameId,
          whitePlayerName: whiteName,
          blackPlayerName: blackName,
          whitePlayerAvatar: targetInvite?.sender?.avatarUrl,
          blackPlayerAvatar: user?.photo,
          timeControl: targetInvite?.timeControl || '5+0',
        });
        setVsModalVisible(true);
      }
    } finally {
      setIsProcessingIncoming(false);
    }
  };

  // Handle declining incoming challenge
  const handleDeclineInvite = async (invitationId: number) => {
    setIsProcessingIncoming(true);
    try {
      await declineInvitation(invitationId);
      setIncomingModalVisible(false);
      setIncomingInvite(null);
    } finally {
      setIsProcessingIncoming(false);
    }
  };

  const handleSignOut = () => {
    authStore.clearAuth();
    router.replace('/login' as any);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.userProfileRow}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {(user?.name || user?.email || 'U')[0].toUpperCase()}
            </Text>
          </View>
          <View style={styles.titleCol}>
            <View style={styles.nameAndIdRow}>
              <Text style={styles.playerName} numberOfLines={1}>
                {user?.name || user?.email || 'Chess Player'}
              </Text>
              {user?.id && (
                <View style={styles.idChip}>
                  <Text style={styles.idChipText}>ID: #{user.id}</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>Select a game mode to begin playing</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.switchAccountButton}
          activeOpacity={0.7}
          onPress={handleSignOut}
        >
          <Text style={styles.switchAccountText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl
              refreshing={isLoadingInvites}
              onRefresh={refreshInvites}
              tintColor="#3B82F6"
            />
          ) : undefined
        }
      >
        {/* Section Heading: Game Modes */}
        <Text style={styles.sectionTitle}>Game Modes</Text>

        {/* Primary Action Cards */}
        <View style={styles.actionsGrid}>
          {/* Play vs AI */}
          <TouchableOpacity
            style={[styles.actionCard, styles.aiCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/play/create?mode=ai' as any)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>🤖</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Instant Play</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Play vs Computer (AI)</Text>
            <Text style={styles.cardDesc}>
              Practice against AI engine with Easy (~800), Medium (~1400), or Hard (~2000) levels.
            </Text>
          </TouchableOpacity>

          {/* Create Match (PvP) */}
          <TouchableOpacity
            style={[styles.actionCard, styles.pvpCard]}
            activeOpacity={0.8}
            onPress={() => router.push('/play/create?mode=pvp' as any)}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardIcon}>⚔️</Text>
              <View style={[styles.badge, styles.pvpBadge]}>
                <Text style={styles.badgeText}>Custom Match</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Custom Match Setup</Text>
            <Text style={styles.cardDesc}>
              Choose time control, invite online friends, or create a room code.
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Interactive Incoming Challenge Popup Modal (Alerts user when challenged) */}
      <IncomingChallengeModal
        visible={incomingModalVisible}
        invitation={incomingInvite}
        isProcessing={isProcessingIncoming}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        onDismiss={() => {
          setIncomingModalVisible(false);
          setIncomingInvite(null);
        }}
      />

      {/* Animated Match Face-Off VS Popup */}
      {vsModalData && (
        <MatchStartVsModal
          visible={vsModalVisible}
          gameId={vsModalData.gameId}
          whitePlayerName={vsModalData.whitePlayerName}
          blackPlayerName={vsModalData.blackPlayerName}
          whitePlayerAvatar={vsModalData.whitePlayerAvatar}
          blackPlayerAvatar={vsModalData.blackPlayerAvatar}
          timeControl={vsModalData.timeControl}
          durationMs={2000}
          onComplete={() => {
            setVsModalVisible(false);
            gameStore.reset();
            router.push(`/game/${vsModalData.gameId}` as any);
          }}
        />
      )}

      <AppFooter activeTab="home" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1318',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1F26',
    backgroundColor: '#12161D',
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleCol: {
    flex: 1,
  },
  nameAndIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 160,
  },
  idChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#60A5FA',
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  switchAccountButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  switchAccountText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  aiCard: {
    backgroundColor: '#151D2A',
    borderColor: '#1E2D44',
  },
  pvpCard: {
    backgroundColor: '#181A26',
    borderColor: '#262A42',
  },
  joinCard: {
    backgroundColor: '#161E1C',
    borderColor: '#1D332D',
  },
  historyCard: {
    backgroundColor: '#1B1822',
    borderColor: '#2D243B',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardIcon: {
    fontSize: 26,
  },
  badge: {
    backgroundColor: '#1E3A5F',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pvpBadge: {
    backgroundColor: '#3730A3',
  },
  joinBadge: {
    backgroundColor: '#064E3B',
  },
  badgeText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
});
