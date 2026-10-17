import React, { useState, useEffect, useCallback } from 'react';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  Modal,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { authStore, useAuthStore } from '../../store/authStore';
import { gameStore } from '../../store/gameStore';
import { useInvitations } from '../../hooks/useInvitations';
import { gameSocket } from '../../socket/game.socket';
import { GameInvitation } from '../../types/game.types';
import { IncomingChallengeModal } from '../../components/game/IncomingChallengeModal';
import { MatchStartVsModal } from '../../components/game/MatchStartVsModal';
import { AppHeader } from '../../components/navigation/AppHeader';
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

  // Fair-Play modal state
  const [fairPlayModalVisible, setFairPlayModalVisible] = useState(false);

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
      <StatusBar barStyle="dark-content" />

      {/* Header - Fixed & Branded with ChessOne Logo */}
      <AppHeader
        showLogo={true}
        showBack={false}
      />

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
        {/* Play World Header */}
        <View style={styles.heroSection}>
          <Text style={styles.eyebrow}>YOUR CHESS WORLD</Text>
          <Text style={styles.heroTitle}>Choose How You Want to Play</Text>
          <Text style={styles.heroSub}>
            Friendly practice with Coach One, games with school classmates, or fair-play competitive matches.
          </Text>
        </View>

        {/* 3 Core Interactive Play Cards */}
        <View style={styles.playCardsList}>
          {/* CARD 1: ♞ Play with Coach One (Computer AI & Guided Practice) */}
          <View style={[styles.playCard, styles.coachOneCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBoxCoach}>
                <Text style={styles.cardIconEmoji}>♞</Text>
              </View>
              <View style={styles.badgeCoach}>
                <Text style={styles.badgeCoachText}>Guided Practice • AI</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Play with Coach One</Text>
            <Text style={styles.cardDesc}>
              Practice against AI engine with gentle guidance, hints, and undo. Choose Easy (~800), Medium (~1400), or Hard (~2000).
            </Text>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={styles.primaryActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/learn/practice' as any)}
              >
                <Feather name="play-circle" size={15} color={COLORS.white} />
                <Text style={styles.primaryActionBtnText}>Coach One Practice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/play/create?mode=ai' as any)}
              >
                <Feather name="settings" size={14} color={COLORS.primary} />
                <Text style={styles.secondaryActionBtnText}>Custom AI Match</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CARD 2: ♧ Play with Classmates (School Multiplayer & Rooms) */}
          <View style={[styles.playCard, styles.classmatesCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBoxClassmates}>
                <Text style={styles.cardIconEmoji}>♧</Text>
              </View>
              <View style={styles.badgeClassmates}>
                <Text style={styles.badgeClassmatesText}>School Club • Unrated</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Play with Classmates</Text>
            <Text style={styles.cardDesc}>
              Challenge friends from Greenwood School in private, safe unrated rooms. Share a 6-digit match code or browse online classmates.
            </Text>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#194E40' }]}
                activeOpacity={0.8}
                onPress={() => router.push('/community' as any)}
              >
                <Feather name="users" size={15} color={COLORS.white} />
                <Text style={styles.primaryActionBtnText}>Classmates Circle</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/play/create?mode=pvp' as any)}
              >
                <Feather name="plus-circle" size={14} color={COLORS.primary} />
                <Text style={styles.secondaryActionBtnText}>Create Room</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/play/join' as any)}
              >
                <Feather name="key" size={14} color={COLORS.primary} />
                <Text style={styles.secondaryActionBtnText}>Join Code</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* CARD 3: ♜ Competitive Matchmaking (Fair-Play Rated Space) */}
          <View style={[styles.playCard, styles.competitiveCard]}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardIconBoxCompetitive}>
                <Text style={styles.cardIconEmoji}>♜</Text>
              </View>
              <View style={styles.badgeCompetitive}>
                <Text style={styles.badgeCompetitiveText}>Rated • Fair-Play</Text>
              </View>
            </View>

            <Text style={styles.cardTitle}>Competitive Matchmaking</Text>
            <Text style={styles.cardDesc}>
              Official rated matchmaking and school tournaments. Fair-play space: Coach hints and engine assistance are strictly disabled.
            </Text>

            <View style={styles.cardActionRow}>
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: '#D9532F' }]}
                activeOpacity={0.8}
                onPress={() => setFairPlayModalVisible(true)}
              >
                <Feather name="shield" size={15} color={COLORS.white} />
                <Text style={styles.primaryActionBtnText}>Fair-Play Match</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryActionBtn}
                activeOpacity={0.8}
                onPress={() => router.push('/tournaments' as any)}
              >
                <Feather name="award" size={14} color="#D9532F" />
                <Text style={[styles.secondaryActionBtnText, { color: '#D9532F' }]}>Tournaments</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fair-Play Space Modal (Matching HTML Prototype) */}
      <Modal
        visible={fairPlayModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setFairPlayModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Competition is a fair-play space</Text>
              <TouchableOpacity
                onPress={() => setFairPlayModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Feather name="x" size={20} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalDesc}>
              Coach hints and live engine assistance are strictly disabled during rated games and official tournaments to maintain fair play.
            </Text>

            <View style={styles.fairPlayBadgesRow}>
              <View style={styles.fairPlayItem}>
                <Text style={styles.fairPlayItemVal}>10 + 5</Text>
                <Text style={styles.fairPlayItemSub}>Rapid format</Text>
              </View>
              <View style={styles.fairPlayItem}>
                <Text style={styles.fairPlayItemVal}>School</Text>
                <Text style={styles.fairPlayItemSub}>Group rating</Text>
              </View>
              <View style={styles.fairPlayItem}>
                <Text style={[styles.fairPlayItemVal, { color: '#D9532F' }]}>Off</Text>
                <Text style={styles.fairPlayItemSub}>Live hints</Text>
              </View>
            </View>

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setFairPlayModalVisible(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={() => {
                  setFairPlayModalVisible(false);
                  router.push('/play/create?mode=pvp' as any);
                }}
              >
                <Text style={styles.modalConfirmBtnText}>Start Rated Match</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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

      <AppFooter activeTab="play" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
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
    backgroundColor: COLORS.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.white,
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
    color: COLORS.textHeading,
    maxWidth: 160,
  },
  idChip: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 2,
  },
  switchAccountButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusButton,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  switchAccountText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  heroSection: {
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textHeading,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  heroSub: {
    fontSize: 12.5,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  playCardsList: {
    gap: 14,
  },
  playCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
    gap: 8,
  },
  coachOneCard: {
    borderColor: '#D5E8CA',
    backgroundColor: '#FCFEFB',
  },
  classmatesCard: {
    borderColor: '#C8DDD7',
    backgroundColor: '#FAFCFB',
  },
  competitiveCard: {
    borderColor: '#F5D3C8',
    backgroundColor: '#FCFAFA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  cardIconBoxCoach: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EBF3E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxClassmates: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E6F3EF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconBoxCompetitive: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FDEEE9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconEmoji: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeCoach: {
    backgroundColor: '#EBF3E7',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCoachText: {
    color: COLORS.primary,
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeClassmates: {
    backgroundColor: '#E6F3EF',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeClassmatesText: {
    color: '#194E40',
    fontSize: 10.5,
    fontWeight: '700',
  },
  badgeCompetitive: {
    backgroundColor: '#FDEEE9',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeCompetitiveText: {
    color: '#D9532F',
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  cardDesc: {
    fontSize: 12.5,
    color: COLORS.textBody,
    lineHeight: 18,
  },
  cardActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.white,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondaryActionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    ...SHADOWS.soft,
    gap: 14,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
    flex: 1,
    marginRight: 10,
  },
  modalDesc: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 19,
  },
  fairPlayBadgesRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  fairPlayItem: {
    flex: 1,
    alignItems: 'center',
  },
  fairPlayItemVal: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  fairPlayItemSub: {
    fontSize: 10,
    color: COLORS.textBody,
    marginTop: 2,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 1.5,
    backgroundColor: '#D9532F',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.white,
  },
});
