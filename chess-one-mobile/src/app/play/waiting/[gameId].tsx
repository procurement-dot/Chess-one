import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Alert,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameService } from '../../../services/game.service';
import { gameSocket } from '../../../socket/game.socket';
import { Game } from '../../../types/game.types';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { AppFooter } from '../../../components/navigation/AppFooter';
import { MatchStartVsModal } from '../../../components/game/MatchStartVsModal';

export default function WaitingLobbyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId: string }>();
  const gameId = params.gameId ? parseInt(params.gameId, 10) : 0;

  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollTimerRef = useRef<any>(null);

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

  const triggerMatchFaceoff = useCallback((activeGame?: Game | null, payload?: any) => {
    if (pollTimerRef.current) clearInterval(pollTimerRef.current);

    const whiteName = payload?.whitePlayer?.name || activeGame?.whitePlayer?.name || 'White Player';
    const blackName = payload?.blackPlayer?.name || activeGame?.blackPlayer?.name || 'Black Player';
    const tc = payload?.timeControl || activeGame?.timeControl || '5+0';

    setVsModalData({
      gameId,
      whitePlayerName: whiteName,
      blackPlayerName: blackName,
      whitePlayerAvatar: null,
      blackPlayerAvatar: null,
      timeControl: tc,
    });
    setVsModalVisible(true);
  }, [gameId]);

  // Load game and setup listeners
  useEffect(() => {
    if (!gameId) return;

    let isMounted = true;

    async function fetchGame() {
      try {
        const gameData = await gameService.getGame(gameId);
        if (!isMounted) return;
        setGame(gameData);

        if (gameData.status === 'ACTIVE') {
          triggerMatchFaceoff(gameData);
          return;
        }
      } catch (err: any) {
        if (!isMounted) return;
        Alert.alert('Lobby Error', 'Unable to load room details.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchGame();

    // Join socket room and listen for game start
    gameSocket.joinGame(gameId);
    const unsubStarted = gameSocket.onGameStarted((payload: any) => {
      if (isMounted) {
        triggerMatchFaceoff(game, payload);
      }
    });

    // Fallback polling every 3.5 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const polled = await gameService.getGame(gameId);
        if (polled.status === 'ACTIVE') {
          triggerMatchFaceoff(polled);
        }
      } catch {
        // ignore polling error
      }
    }, 3500);

    return () => {
      isMounted = false;
      unsubStarted();
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [gameId, game, triggerMatchFaceoff]);

  const handleShare = async () => {
    if (!game?.gameCode) return;
    try {
      await Share.share({
        message: `Join my live chess match on ChessOne! Room code: ${game.gameCode}`,
      });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore share cancellation
    }
  };

  const handleCancelMatch = async () => {
    Alert.alert('Cancel Match', 'Are you sure you want to cancel this match lobby?', [
      { text: 'Keep Waiting', style: 'cancel' },
      {
        text: 'Cancel Match',
        style: 'destructive',
        onPress: async () => {
          setIsCancelling(true);
          try {
            await gameService.cancelGame(gameId);
            router.replace('/play' as any);
          } catch {
            router.replace('/play' as any);
          } finally {
            setIsCancelling(false);
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#194E40" />
          <Text style={styles.loadingText}>Setting up match lobby...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Match Lobby"
        subtitle={`Room #${gameId}`}
        showBack={true}
        onBack={handleCancelMatch}
      />

      <View style={styles.content}>
        {/* Pulsing indicator */}
        <View style={styles.indicatorContainer}>
          <ActivityIndicator size="large" color="#194E40" />
        </View>

        <Text style={styles.waitingTitle}>Waiting for Opponent</Text>
        <Text style={styles.waitingSubtitle}>
          Share this room code with a friend to begin playing immediately.
        </Text>

        {/* Room Code Card */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>ROOM CODE</Text>
          <Text style={styles.codeValue}>{game?.gameCode || '------'}</Text>

          <TouchableOpacity
            style={styles.shareButton}
            activeOpacity={0.8}
            onPress={handleShare}
          >
            <Text style={styles.shareButtonText}>
              {copied ? '✓ Shared / Copied' : '📤 Share Room Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Match Settings Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>
              ⏱ {game?.timeControl || '5+0'} Time Control
            </Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeText}>
              {game?.invitations && game.invitations.length > 0 ? '✉️ Direct Invite' : '🌐 Open Room'}
            </Text>
          </View>
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          activeOpacity={0.8}
          disabled={isCancelling}
          onPress={handleCancelMatch}
        >
          {isCancelling ? (
            <ActivityIndicator color="#EF4444" />
          ) : (
            <Text style={styles.cancelBtnText}>Cancel Match</Text>
          )}
        </TouchableOpacity>
      </View>

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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
  },
  loadingText: {
    fontSize: 15,
    color: '#74817A',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 36,
    alignItems: 'center',
  },
  indicatorContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF3E8',
    borderWidth: 1,
    borderColor: '#D5DFC8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 8,
    textAlign: 'center',
  },
  waitingSubtitle: {
    fontSize: 14,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    maxWidth: 290,
  },
  codeCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E4E9E1',
    marginBottom: 24,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#74817A',
    letterSpacing: 2,
    marginBottom: 8,
  },
  codeValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#194E40',
    letterSpacing: 6,
    marginBottom: 20,
  },
  shareButton: {
    backgroundColor: '#194E40',
    height: 46,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 36,
  },
  infoBadge: {
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  infoBadgeText: {
    color: '#194E40',
    fontSize: 12,
    fontWeight: '600',
  },
  cancelBtn: {
    height: 48,
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  cancelBtnText: {
    color: '#C53030',
    fontSize: 14,
    fontWeight: '700',
  },
});
