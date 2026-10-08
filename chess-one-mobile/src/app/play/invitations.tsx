import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useInvitations } from '../../hooks/useInvitations';
import { InvitationCard } from '../../components/game/InvitationCard';
import { MatchStartVsModal } from '../../components/game/MatchStartVsModal';

export default function InvitationsScreen() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const {
    invitations,
    isLoading,
    processingId,
    refresh,
    acceptInvitation,
    declineInvitation,
  } = useInvitations(isAuthenticated);

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

  const handleAccept = async (invitationId: number) => {
    const invite = invitations.find((i) => i.id === invitationId);
    const game = await acceptInvitation(invitationId);
    const gameId = (game as any)?.gameId || game?.id || invite?.gameId;
    if (gameId) {
      const myName = user?.name || user?.email || 'You';
      const oppName = invite?.sender?.name || invite?.sender?.email || 'Opponent';

      let whiteName = oppName;
      let blackName = myName;

      if ((game as any)?.whitePlayer?.name && (game as any)?.blackPlayer?.name) {
        whiteName = (game as any).whitePlayer.name;
        blackName = (game as any).blackPlayer.name;
      } else if ((game as any)?.playerColor === 'WHITE') {
        whiteName = myName;
        blackName = oppName;
      }

      setVsModalData({
        gameId,
        whitePlayerName: whiteName,
        blackPlayerName: blackName,
        whitePlayerAvatar: invite?.sender?.avatarUrl,
        blackPlayerAvatar: user?.photo,
        timeControl: invite?.timeControl || '5+0',
      });
      setVsModalVisible(true);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.7}
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace('/play' as any);
            }
          }}
        >
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Match Invitations</Text>
        <View style={styles.spacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor="#194E40"
          />
        }
      >
        {isLoading && invitations.length === 0 ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#194E40" />
            <Text style={styles.loadingText}>Loading challenges...</Text>
          </View>
        ) : invitations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📬</Text>
            <Text style={styles.emptyTitle}>No pending challenges</Text>
            <Text style={styles.emptySubtitle}>
              When someone challenges you to a game, it will appear right here.
            </Text>
          </View>
        ) : (
          invitations.map((inv) => (
            <InvitationCard
              key={inv.id}
              invitation={inv}
              onAccept={handleAccept}
              onDecline={declineInvitation}
              isProcessing={processingId === inv.id}
            />
          ))
        )}
      </ScrollView>

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
            router.replace(`/game/${vsModalData.gameId}` as any);
          }}
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    fontSize: 26,
    color: '#202D29',
    lineHeight: 28,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202D29',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  centerContainer: {
    paddingTop: 80,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#74817A',
  },
  emptyContainer: {
    paddingTop: 80,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 20,
  },
});
