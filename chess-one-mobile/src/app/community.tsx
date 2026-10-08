import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameService } from '../services/game.service';
import { gameSocket } from '../socket/game.socket';
import { OnlineUser } from '../types/game.types';
import { AppHeader } from '../components/navigation/AppHeader';
import { AppFooter } from '../components/navigation/AppFooter';
import { OutgoingChallengeModal } from '../components/game/OutgoingChallengeModal';
import { MatchStartVsModal } from '../components/game/MatchStartVsModal';
import { useOnlineUsers } from '../hooks/useOnlineUsers';
import { authStore, useAuthStore } from '../store/authStore';
import { gameStore } from '../store/gameStore';

export default function CommunityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ timeControl?: string }>();
  const { user, isAuthenticated } = useAuthStore();

  const selectedTimeControl = params.timeControl || '5+0';
  const [activeFilterTab, setActiveFilterTab] = useState<'online' | 'all'>('online');
  const [searchQuery, setSearchQuery] = useState('');

  // Online users hook
  const {
    users: allUsers,
    onlineCount,
    isLoading,
    refresh,
  } = useOnlineUsers(isAuthenticated);

  // Challenge states
  const [invitingUserId, setInvitingUserId] = useState<number | null>(null);
  const [outgoingTarget, setOutgoingTarget] = useState<OnlineUser | null>(null);
  const [outgoingStatus, setOutgoingStatus] = useState<
    'sending' | 'waiting' | 'declined' | 'error'
  >('sending');
  const [outgoingError, setOutgoingError] = useState('');
  const [activeGameId, setActiveGameId] = useState<number | null>(null);

  // VS Faceoff Modal states
  const [vsModalVisible, setVsModalVisible] = useState(false);
  const [vsModalData, setVsModalData] = useState<{
    gameId: number;
    whitePlayerName: string;
    blackPlayerName: string;
    whitePlayerAvatar?: string | null;
    blackPlayerAvatar?: string | null;
    timeControl: string;
  } | null>(null);

  // Listen for outgoing challenge acceptance
  useEffect(() => {
    if (!activeGameId) return;

    const triggerVsFaceoff = (gData?: any) => {
      const targetId = activeGameId;
      const targetUser = outgoingTarget;
      setOutgoingTarget(null);
      setActiveGameId(null);

      const myName = authStore.getState().user?.name || 'You';
      const oppName = targetUser?.name || targetUser?.email || 'Opponent';

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
          const myColor =
            gData?.playerColor ||
            (gData?.blackPlayerId === authStore.getState().user?.id ? 'BLACK' : 'WHITE');
          window.sessionStorage.setItem(`chess_game_color_${targetId}`, myColor);
        }
      } catch {}

      setVsModalData({
        gameId: targetId,
        whitePlayerName: whiteName,
        blackPlayerName: blackName,
        whitePlayerAvatar: null,
        blackPlayerAvatar: null,
        timeControl: gData?.timeControl || selectedTimeControl,
      });
      setVsModalVisible(true);
    };

    const unsubStarted = gameSocket.onGameStarted((payload: any) => {
      console.log('[Community] Challenge accepted! Starting face-off:', activeGameId);
      triggerVsFaceoff(payload);
    });

    const unsubDeclined = gameSocket.onInvitationDeclined(() => {
      console.log('[Community] Challenge declined by friend');
      setOutgoingStatus('declined');
    });

    // Polling fallback
    const pollInterval = setInterval(async () => {
      try {
        const g = await gameService.getGame(activeGameId);
        if (g.status === 'ACTIVE') {
          triggerVsFaceoff(g);
        }
      } catch {}
    }, 1500);

    return () => {
      unsubStarted();
      unsubDeclined();
      clearInterval(pollInterval);
    };
  }, [activeGameId, outgoingTarget, selectedTimeControl]);

  // Handle challenging an online or community player
  const handleChallengePlayer = async (target: OnlineUser) => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign In Required',
        'Please sign in to send game invitations to players.',
        [
          { text: 'Go to Login', onPress: () => router.push('/login' as any) },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }

    setInvitingUserId(target.id);
    setOutgoingTarget(target);
    setOutgoingStatus('sending');
    setOutgoingError('');

    try {
      const res = await gameService.quickInvite(target.id, selectedTimeControl);
      setActiveGameId(res.gameId);
      setOutgoingStatus('waiting');
      gameSocket.joinGame(res.gameId);
    } catch (err: any) {
      setOutgoingStatus('error');
      setOutgoingError(
        err.userFriendlyMessage || err.message || 'Could not send invitation'
      );
    } finally {
      setInvitingUserId(null);
    }
  };

  // Filter and search players
  const filteredUsers = useMemo(() => {
    let list = allUsers;
    if (activeFilterTab === 'online') {
      list = list.filter((u) => u.isOnline);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          String(u.id).includes(q)
      );
    }

    return list;
  }, [allUsers, activeFilterTab, searchQuery]);

  const currentUserId = user?.id ? parseInt(String(user.id), 10) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <AppHeader
        title="Community"
        subtitle="Active Players & Match Challenges"
        showBack={true}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#38BDF8"
          />
        }
      >

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search players by name or ID..."
            placeholderTextColor="#64748B"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {Boolean(searchQuery) && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Text style={styles.clearSearchIcon}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeFilterTab === 'online' && styles.tabBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveFilterTab('online')}
          >
            <View style={styles.tabRow}>
              <View style={styles.greenDot} />
              <Text
                style={[
                  styles.tabBtnText,
                  activeFilterTab === 'online' && styles.tabBtnTextActive,
                ]}
              >
                Online Now ({onlineCount})
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeFilterTab === 'all' && styles.tabBtnActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setActiveFilterTab('all')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeFilterTab === 'all' && styles.tabBtnTextActive,
              ]}
            >
              👥 All Players ({allUsers.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Players List */}
        {isLoading && allUsers.length === 0 ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#38BDF8" />
            <Text style={styles.loadingText}>Loading community players...</Text>
          </View>
        ) : filteredUsers.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>♟️</Text>
            <Text style={styles.emptyTitle}>
              {activeFilterTab === 'online'
                ? 'No players online right now'
                : 'No players found'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeFilterTab === 'online'
                ? 'Switch to "All Players" to challenge registered friends, or share a 6-digit match code.'
                : 'Try adjusting your search query.'}
            </Text>

            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.8}
              onPress={refresh}
            >
              <Text style={styles.refreshBtnText}>🔄 Refresh Players</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.playersList}>
            {filteredUsers.map((item) => {
              const isMe = currentUserId === item.id;
              const isInviting = invitingUserId === item.id;
              const initials = (item.name || item.email || 'P')[0].toUpperCase();

              return (
                <View key={`player-${item.id}`} style={styles.playerCard}>
                  {/* Avatar with Status Dot */}
                  <View style={styles.avatarWrapper}>
                    <View
                      style={[
                        styles.avatarBox,
                        item.isOnline ? styles.avatarOnline : styles.avatarOffline,
                      ]}
                    >
                      <Text style={styles.avatarInitial}>{initials}</Text>
                    </View>
                    <View
                      style={[
                        styles.avatarDot,
                        item.isOnline ? styles.dotOnline : styles.dotOffline,
                      ]}
                    />
                  </View>

                  {/* Player Info */}
                  <View style={styles.playerInfo}>
                    <View style={styles.nameRow}>
                      <Text style={styles.playerName} numberOfLines={1}>
                        {item.name || item.email}
                      </Text>
                      <View style={styles.idChip}>
                        <Text style={styles.idChipText}>#{item.id}</Text>
                      </View>
                    </View>

                    <Text style={styles.playerStatusText}>
                      {item.isOnline ? '🟢 Online & Ready' : '⚪ Offline'}
                    </Text>
                  </View>

                  {/* Action Button */}
                  {isMe ? (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.challengeBtn,
                        item.isOnline
                          ? styles.challengeBtnOnline
                          : styles.challengeBtnOffline,
                        isInviting && styles.btnDisabled,
                      ]}
                      activeOpacity={0.8}
                      disabled={isInviting}
                      onPress={() => handleChallengePlayer(item)}
                    >
                      {isInviting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.challengeBtnText}>⚔️ Invite</Text>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Outgoing Challenge Waiting Modal */}
      <OutgoingChallengeModal
        visible={Boolean(outgoingTarget)}
        targetUser={outgoingTarget}
        status={outgoingStatus}
        timeControl={selectedTimeControl}
        errorMessage={outgoingError}
        onCancel={() => {
          setOutgoingTarget(null);
          setActiveGameId(null);
        }}
      />

      {/* Horizontal Animated VS Face-off Modal */}
      {Boolean(vsModalData) && (
        <MatchStartVsModal
          visible={vsModalVisible}
          gameId={vsModalData!.gameId}
          whitePlayerName={vsModalData!.whitePlayerName}
          blackPlayerName={vsModalData!.blackPlayerName}
          whitePlayerAvatar={vsModalData!.whitePlayerAvatar}
          blackPlayerAvatar={vsModalData!.blackPlayerAvatar}
          timeControl={vsModalData!.timeControl}
          durationMs={2000}
          onComplete={() => {
            const gid = vsModalData!.gameId;
            setVsModalVisible(false);
            setVsModalData(null);
            gameStore.reset();
            router.replace(`/game/${gid}` as any);
          }}
        />
      )}

      {/* Persistent Bottom Footer */}
      <AppFooter activeTab="community" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1318',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  sectionHeader: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  timeControlsRow: {
    gap: 8,
    paddingVertical: 6,
    marginBottom: 14,
  },
  timeControlPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#161F2E',
    borderWidth: 1,
    borderColor: '#223049',
    alignItems: 'center',
    minWidth: 78,
  },
  timeControlPillActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#38BDF8',
  },
  timeControlLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  timeControlLabelActive: {
    color: '#FFFFFF',
  },
  timeControlSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  timeControlSubActive: {
    color: '#93C5FD',
  },
  joinCodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131A26',
    borderWidth: 1,
    borderColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    gap: 12,
  },
  joinCodeIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinCodeIcon: {
    fontSize: 18,
  },
  joinCodeTextBox: {
    flex: 1,
  },
  joinCodeTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  joinCodeSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  joinCodeArrow: {
    fontSize: 14,
    color: '#38BDF8',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161D27',
    borderWidth: 1,
    borderColor: '#243042',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    marginBottom: 12,
    gap: 8,
  },
  searchIcon: {
    fontSize: 14,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  clearSearchIcon: {
    color: '#94A3B8',
    fontSize: 14,
    paddingHorizontal: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#161D27',
    borderRadius: 12,
    padding: 3,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#222F42',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#2563EB',
  },
  tabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  greenDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  centerBox: {
    paddingVertical: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  emptyBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  refreshBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  refreshBtnText: {
    color: '#E2E8F0',
    fontSize: 12.5,
    fontWeight: '700',
  },
  playersList: {
    gap: 10,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141A24',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#202B3B',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOnline: {
    backgroundColor: '#1D4ED8',
  },
  avatarOffline: {
    backgroundColor: '#334155',
  },
  avatarInitial: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#141A24',
  },
  dotOnline: {
    backgroundColor: '#10B981',
  },
  dotOffline: {
    backgroundColor: '#64748B',
  },
  playerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 150,
  },
  idChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
  },
  playerStatusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  youBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#1E293B',
    borderRadius: 8,
  },
  youBadgeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  challengeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  challengeBtnOnline: {
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  challengeBtnOffline: {
    backgroundColor: '#374151',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  challengeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
