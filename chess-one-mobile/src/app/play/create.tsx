import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameService } from '../../services/game.service';
import { gameSocket } from '../../socket/game.socket';
import { GameType, AIDifficulty, ColorPreference, OnlineUser } from '../../types/game.types';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { InviteFriendModal } from '../../components/game/InviteFriendModal';
import { OutgoingChallengeModal } from '../../components/game/OutgoingChallengeModal';
import { MatchStartVsModal } from '../../components/game/MatchStartVsModal';
import { useOnlineUsers } from '../../hooks/useOnlineUsers';
import { authStore, useAuthStore } from '../../store/authStore';
import { gameStore } from '../../store/gameStore';

const TIME_CONTROLS = [
  { id: '1+0', label: '1 min', sub: 'Bullet' },
  { id: '3+0', label: '3 min', sub: 'Blitz' },
  { id: '3+2', label: '3 | 2', sub: 'Blitz' },
  { id: '5+0', label: '5 min', sub: 'Blitz' },
  { id: '10+0', label: '10 min', sub: 'Rapid' },
  { id: '15+10', label: '15 | 10', sub: 'Rapid' },
];

export default function CreateMatchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: string }>();
  const { isAuthenticated } = useAuthStore();

  const initialMode: GameType =
    params.mode === 'ai' ? 'PLAYER_VS_AI' : 'PLAYER_VS_PLAYER';

  const [gameType, setGameType] = useState<GameType>(initialMode);
  const [timeControl, setTimeControl] = useState('5+0');
  const [selectedColor, setSelectedColor] = useState<ColorPreference>('WHITE');
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>('MEDIUM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Online users hook (returns only genuinely online players)
  const {
    users: onlineUsers,
    onlineCount,
    isLoading: isLoadingUsers,
    refresh: refreshOnlineUsers,
  } = useOnlineUsers(isAuthenticated);

  // Invite modal state
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);

  // Outgoing challenge state
  const [outgoingTarget, setOutgoingTarget] = useState<OnlineUser | null>(null);
  const [outgoingStatus, setOutgoingStatus] = useState<
    'sending' | 'waiting' | 'declined' | 'error'
  >('waiting');
  const [outgoingError, setOutgoingError] = useState('');
  const [activeCreatedGameId, setActiveCreatedGameId] = useState<number | null>(null);

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

  // Listen for outgoing challenge acceptance
  useEffect(() => {
    if (!activeCreatedGameId) return;

    const triggerVsFaceoff = (gData?: any) => {
      const targetId = activeCreatedGameId;
      const targetUser = outgoingTarget;
      setOutgoingTarget(null);
      setActiveCreatedGameId(null);

      const myName = (authStore.getState().user?.name || 'You');
      const oppName = (targetUser?.name || targetUser?.email || 'Opponent');

      let whiteName = myName;
      let blackName = oppName;

      if (gData?.whitePlayer?.name && gData?.blackPlayer?.name) {
        whiteName = gData.whitePlayer.name;
        blackName = gData.blackPlayer.name;
      } else if (gData?.playerColor === 'BLACK') {
        whiteName = oppName;
        blackName = myName;
      }

      try {
        if (typeof window !== 'undefined' && window.sessionStorage && targetId) {
          const myColor = gData?.playerColor || (gData?.blackPlayerId === authStore.getState().user?.id ? 'BLACK' : 'WHITE');
          window.sessionStorage.setItem(`chess_game_color_${targetId}`, myColor);
        }
      } catch {}

      setVsModalData({
        gameId: targetId,
        whitePlayerName: whiteName,
        blackPlayerName: blackName,
        whitePlayerAvatar: null,
        blackPlayerAvatar: null,
        timeControl: gData?.timeControl || timeControl,
      });
      setVsModalVisible(true);
    };

    const unsubStarted = gameSocket.onGameStarted((payload: any) => {
      console.log('[CreateMatch] Outgoing challenge accepted! Starting face-off:', activeCreatedGameId);
      triggerVsFaceoff(payload);
    });

    const unsubDeclined = gameSocket.onInvitationDeclined(() => {
      console.log('[CreateMatch] Challenge declined by friend');
      setOutgoingStatus('declined');
    });

    // Polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const g = await gameService.getGame(activeCreatedGameId);
        if (g.status === 'ACTIVE') {
          triggerVsFaceoff(g);
        }
      } catch {}
    }, 2500);

    return () => {
      unsubStarted();
      unsubDeclined();
      clearInterval(pollInterval);
    };
  }, [activeCreatedGameId, outgoingTarget, timeControl]);

  // Handle 1-Click invite from the InviteFriendModal
  const handleInviteOnlineFriend = async (target: OnlineUser) => {
    setInvitingUserId(target.id);
    setInviteModalVisible(false);
    setOutgoingTarget(target);
    setOutgoingStatus('sending');
    setOutgoingError('');

    try {
      const res = await gameService.quickInvite(target.id, timeControl);
      setActiveCreatedGameId(res.gameId);
      setOutgoingStatus('waiting');
      gameSocket.joinGame(res.gameId);
    } catch (err: any) {
      setOutgoingStatus('error');
      setOutgoingError(
        err.userFriendlyMessage || err.message || 'Could not send challenge to friend'
      );
    } finally {
      setInvitingUserId(null);
    }
  };

  // Handle Create Room (Get 6-digit Code)
  const handleCreate = async () => {
    // Check authentication
    let token = authStore.getState().chessOneToken;
    if (!token && typeof window !== 'undefined' && window.localStorage) {
      token = window.localStorage.getItem('chess_one_token');
      if (token) {
        authStore.setChessOneToken(token);
      }
    }

    if (!token) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to create or join a chess match.',
        [
          { text: 'Go to Login', onPress: () => router.replace('/login' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await gameService.createGame({
        gameType,
        timeControl,
        colorPreference: selectedColor,
        aiDifficulty: gameType === 'PLAYER_VS_AI' ? aiDifficulty : undefined,
      });

      const gameId = response.gameId;
      const playerColor = response.playerColor || (selectedColor === 'BLACK' ? 'BLACK' : 'WHITE');

      if (gameId && typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem(`chess_game_color_${gameId}`, playerColor);
      }

      if (gameType === 'PLAYER_VS_AI' || response.status === 'ACTIVE') {
        router.replace({
          pathname: `/game/${gameId}`,
          params: { mode: gameType === 'PLAYER_VS_AI' ? 'ai' : 'pvp' },
        } as any);
      } else {
        router.replace(`/play/waiting/${gameId}` as any);
      }
    } catch (err: any) {
      const msg = err.userFriendlyMessage || err.message || 'Could not create game';
      Alert.alert('Create Game Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <AppHeader
        title="Match Setup"
        subtitle={gameType === 'PLAYER_VS_AI' ? 'Play vs Computer' : 'Multiplayer Match'}
        showBack={true}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Game Mode Segment */}
        <View style={styles.segmentContainer}>
          <TouchableOpacity
            style={[styles.segmentBtn, gameType === 'PLAYER_VS_AI' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setGameType('PLAYER_VS_AI')}
          >
            <Text style={[styles.segmentText, gameType === 'PLAYER_VS_AI' && styles.segmentTextActive]}>
              🤖 Computer
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentBtn, gameType === 'PLAYER_VS_PLAYER' && styles.segmentBtnActive]}
            activeOpacity={0.8}
            onPress={() => setGameType('PLAYER_VS_PLAYER')}
          >
            <Text style={[styles.segmentText, gameType === 'PLAYER_VS_PLAYER' && styles.segmentTextActive]}>
              ⚔️ Multiplayer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Time Control Section */}
        <Text style={styles.sectionTitle}>Time Control</Text>
        <View style={styles.timeGrid}>
          {TIME_CONTROLS.map((tc) => {
            const isSelected = timeControl === tc.id;
            return (
              <TouchableOpacity
                key={tc.id}
                style={[styles.timeBtn, isSelected && styles.timeBtnActive]}
                activeOpacity={0.8}
                onPress={() => setTimeControl(tc.id)}
              >
                <Text style={[styles.timeLabel, isSelected && styles.timeLabelActive]}>
                  {tc.label}
                </Text>
                <Text style={[styles.timeSub, isSelected && styles.timeSubActive]}>
                  {tc.sub}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Piece Color Choice */}
        <Text style={styles.sectionTitle}>Play as</Text>
        <View style={styles.colorRow}>
          <TouchableOpacity
            style={[styles.colorBtn, selectedColor === 'WHITE' && styles.colorBtnActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedColor('WHITE')}
          >
            <Text style={styles.pieceSymbol}>♔</Text>
            <Text style={styles.colorLabel}>White</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.colorBtn, selectedColor === 'BLACK' && styles.colorBtnActive]}
            activeOpacity={0.8}
            onPress={() => setSelectedColor('BLACK')}
          >
            <Text style={styles.pieceSymbol}>♚</Text>
            <Text style={styles.colorLabel}>Black</Text>
          </TouchableOpacity>
        </View>

        {/* AI Difficulty (If PLAYER_VS_AI) */}
        {gameType === 'PLAYER_VS_AI' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Computer Difficulty</Text>
            <View style={styles.difficultyRow}>
              {(['EASY', 'MEDIUM', 'HARD'] as AIDifficulty[]).map((diff) => {
                const isSelected = aiDifficulty === diff;
                return (
                  <TouchableOpacity
                    key={diff}
                    style={[styles.diffBtn, isSelected && styles.diffBtnActive]}
                    activeOpacity={0.8}
                    onPress={() => setAiDifficulty(diff)}
                  >
                    <Text style={[styles.diffLabel, isSelected && styles.diffLabelActive]}>
                      {diff === 'EASY' ? 'Easy' : diff === 'MEDIUM' ? 'Medium' : 'Hard'}
                    </Text>
                    <Text style={styles.diffRating}>
                      {diff === 'EASY' ? '~800' : diff === 'MEDIUM' ? '~1400' : '~2000'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Multiplayer Invite Friend Section (Replacing User ID input) */}
        {gameType === 'PLAYER_VS_PLAYER' && (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Invite Friend</Text>

            <TouchableOpacity
              style={styles.inviteFriendCard}
              activeOpacity={0.8}
              onPress={() => {
                router.push({
                  pathname: '/community',
                  params: { timeControl },
                } as any);
              }}
            >
              <View style={styles.inviteFriendIconBox}>
                <Text style={styles.inviteFriendIcon}>👥</Text>
              </View>
              <View style={styles.inviteFriendTextBox}>
                <Text style={styles.inviteFriendTitle}>Invite Online Friend</Text>
                <Text style={styles.inviteFriendSub}>
                  {onlineCount > 0
                    ? `🟢 ${onlineCount} friend${onlineCount > 1 ? 's' : ''} currently online`
                    : 'Check online players & challenge directly'}
                </Text>
              </View>
              <View style={styles.inviteArrowBox}>
                <Text style={styles.inviteArrowText}>➔</Text>
              </View>
            </TouchableOpacity>

            <Text style={styles.hintText}>
              Or tap &quot;Create Room&quot; below to generate a shareable 6-digit game code.
            </Text>
          </View>
        )}

        {/* Primary Submit Button */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.85}
          disabled={isSubmitting}
          onPress={handleCreate}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>
              {gameType === 'PLAYER_VS_AI' ? 'Start Match' : 'Create Room (Get Code)'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Invite Online Friend Modal */}
      <InviteFriendModal
        visible={inviteModalVisible}
        onlineUsers={onlineUsers}
        isLoading={isLoadingUsers}
        timeControl={timeControl}
        invitingUserId={invitingUserId}
        onInvite={handleInviteOnlineFriend}
        onRefresh={refreshOnlineUsers}
        onClose={() => setInviteModalVisible(false)}
      />

      {/* Outgoing Challenge Waiting Modal */}
      <OutgoingChallengeModal
        visible={Boolean(outgoingTarget)}
        targetUser={outgoingTarget}
        status={outgoingStatus}
        timeControl={timeControl}
        errorMessage={outgoingError}
        onCancel={() => {
          setOutgoingTarget(null);
          setActiveCreatedGameId(null);
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

      {/* Persistent Bottom Footer */}
      <AppFooter activeTab="create" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F7F2',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#EEF3E8',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#194E40',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#74817A',
  },
  segmentTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 10,
    marginTop: 4,
  },
  sectionBlock: {
    marginTop: 8,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  timeBtn: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  timeBtnActive: {
    borderColor: '#194E40',
    backgroundColor: '#EEF3E8',
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202D29',
  },
  timeLabelActive: {
    color: '#194E40',
  },
  timeSub: {
    fontSize: 11,
    color: '#74817A',
    marginTop: 2,
  },
  timeSubActive: {
    color: '#194E40',
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  colorBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  colorBtnActive: {
    borderColor: '#194E40',
    backgroundColor: '#EEF3E8',
  },
  pieceSymbol: {
    fontSize: 26,
    color: '#202D29',
    marginBottom: 4,
  },
  colorLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#74817A',
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  diffBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  diffBtnActive: {
    borderColor: '#194E40',
    backgroundColor: '#EEF3E8',
  },
  diffLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202D29',
  },
  diffLabelActive: {
    color: '#194E40',
  },
  diffRating: {
    fontSize: 11,
    color: '#74817A',
    marginTop: 2,
  },
  inviteFriendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    gap: 12,
    marginBottom: 8,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  inviteFriendIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  inviteFriendIcon: {
    fontSize: 20,
  },
  inviteFriendTextBox: {
    flex: 1,
  },
  inviteFriendTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 2,
  },
  inviteFriendSub: {
    fontSize: 12,
    color: '#74817A',
  },
  inviteArrowBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteArrowText: {
    color: '#194E40',
    fontSize: 14,
    fontWeight: '800',
  },
  hintText: {
    fontSize: 12,
    color: '#74817A',
    lineHeight: 18,
    marginBottom: 18,
  },
  submitBtn: {
    backgroundColor: '#194E40',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
    marginTop: 6,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
