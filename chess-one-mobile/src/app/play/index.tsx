import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image,
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

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');

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

  // Track invitations already accepted/declined to prevent re-opening modal loop
  const handledInvitesRef = React.useRef<Set<number>>(new Set());

  // Show incoming challenge popup if there are pending invitations
  useEffect(() => {
    const unhandled = invitations.filter((inv) => !handledInvitesRef.current.has(inv.id));
    if (unhandled.length > 0 && !incomingModalVisible && !vsModalVisible) {
      setIncomingInvite(unhandled[0]);
      setIncomingModalVisible(true);
    }
  }, [invitations, incomingModalVisible, vsModalVisible]);

  // Handle accepting incoming challenge
  const handleAcceptInvite = async (invitationId: number) => {
    handledInvitesRef.current.add(invitationId);
    setIsProcessingIncoming(true);
    setIncomingModalVisible(false);
    setIncomingInvite(null);

    try {
      const targetInvite =
        incomingInvite?.id === invitationId
          ? incomingInvite
          : invitations.find((i) => i.id === invitationId);

      const game = await acceptInvitation(invitationId);
      const gameId = (game as any)?.gameId || game?.id || targetInvite?.gameId;

      if (gameId) {
        const playerColor = (game as any)?.playerColor || 'BLACK';
        try {
          if (typeof window !== 'undefined' && window.sessionStorage) {
            window.sessionStorage.setItem(`chess_game_color_${gameId}`, playerColor);
          }
        } catch {}

        // Reset gameStore and navigate immediately so user doesn't lose time
        gameStore.reset();
        router.replace(`/game/${gameId}` as any);
      }
    } catch (err) {
      console.warn('[PlayHub] Accept invite error:', err);
    } finally {
      setIsProcessingIncoming(false);
    }
  };

  // Handle declining incoming challenge
  const handleDeclineInvite = async (invitationId: number) => {
    handledInvitesRef.current.add(invitationId);
    setIsProcessingIncoming(true);
    setIncomingModalVisible(false);
    setIncomingInvite(null);

    try {
      await declineInvitation(invitationId);
    } catch (err) {
      console.warn('[PlayHub] Decline invite error:', err);
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
      <StatusBar barStyle="dark-content" />

      {/* Top Header with Official Logo */}
      <View style={styles.header}>
        <Image
          source={logoBanner}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerUserChip}
            activeOpacity={0.8}
            onPress={() => router.push('/login' as any)}
          >
            <View style={styles.avatarCircleSmall}>
              <Text style={styles.avatarLetterSmall}>
                {(user?.name || user?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.userChipName} numberOfLines={1}>
              {user?.name ? user.name.split(' ')[0] : 'Profile'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.switchAccountButton}
            activeOpacity={0.7}
            onPress={handleSignOut}
          >
            <Text style={styles.switchAccountText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
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
              tintColor="#194E40"
            />
          ) : undefined
        }
      >
        {/* Welcome Player Greeting Card */}
        <View style={styles.welcomeCard}>
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
              <Text style={styles.subtitle}>Welcome back! Choose a match mode to begin</Text>
            </View>
          </View>
        </View>

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
            router.replace(`/game/${vsModalData.gameId}` as any);
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
    backgroundColor: '#F5F7F2',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
    backgroundColor: '#FFFFFF',
  },
  headerLogo: {
    width: 120,
    height: 42,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerUserChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  avatarCircleSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#194E40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetterSmall: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  userChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#194E40',
    maxWidth: 80,
  },
  welcomeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E4E9E1',
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
    backgroundColor: '#194E40',
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
    color: '#202D29',
    maxWidth: 160,
  },
  idChip: {
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#194E40',
  },
  subtitle: {
    fontSize: 12,
    color: '#74817A',
    marginTop: 2,
  },
  switchAccountButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  switchAccountText: {
    fontSize: 12,
    color: '#C53030',
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
    color: '#202D29',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  aiCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E9E1',
  },
  pvpCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E9E1',
  },
  joinCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E9E1',
  },
  historyCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E4E9E1',
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
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D5DFC8',
  },
  pvpBadge: {
    backgroundColor: '#E5EDDA',
    borderColor: '#C8D9BE',
  },
  joinBadge: {
    backgroundColor: '#EEF3E8',
  },
  badgeText: {
    color: '#194E40',
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#74817A',
    lineHeight: 18,
  },
});
