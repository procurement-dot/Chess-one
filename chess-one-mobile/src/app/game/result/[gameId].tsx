import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { gameService } from '../../../services/game.service';
import { useAuthStore } from '../../../store/authStore';
import { Game } from '../../../types/game.types';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { AppFooter } from '../../../components/navigation/AppFooter';
import { AiReviewModal } from '../../../components/game/AiReviewModal';

export default function GameResultScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId: string }>();
  const gameId = params.gameId ? parseInt(params.gameId, 10) : 0;
  const { user } = useAuthStore();

  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [aiReviewVisible, setAiReviewVisible] = useState(false);

  useEffect(() => {
    if (!gameId) return;

    let isMounted = true;
    async function loadResult() {
      try {
        const gameData = await gameService.getGame(gameId);
        if (isMounted) {
          setGame(gameData);
        }
      } catch (err) {
        console.warn('Failed to load result:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadResult();
    return () => {
      isMounted = false;
    };
  }, [gameId]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Finalizing match result...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentUserId = user?.id ? parseInt(user.id, 10) : null;
  const winnerId = game?.winnerId;
  const isDraw = game?.result === 'DRAW';
  const isWinner = winnerId && currentUserId && winnerId === currentUserId;
  const isLoser = winnerId && currentUserId && winnerId !== currentUserId;

  const titleText = isDraw
    ? 'Draw'
    : isWinner
    ? 'Victory!'
    : isLoser
    ? 'Defeat'
    : winnerId
    ? `${game?.winner?.name || 'Winner'} won!`
    : 'Game Finished';

  const titleIcon = isDraw ? '🤝' : isWinner ? '🏆' : isLoser ? '💔' : '🏁';

  // Format result description (e.g. "by checkmate", "by resignation", "by timeout")
  const formatEndReason = () => {
    if (game?.result === 'CHECKMATE') return 'Checkmate';
    if (game?.result === 'RESIGNATION') return 'Resignation';
    if (game?.result === 'TIMEOUT') return 'Time Out';
    if (game?.result === 'STALEMATE') return 'Stalemate';
    if (game?.result === 'DRAW') return 'Draw by Agreement';
    return 'Match Completed';
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <AppHeader
        title="Match Overview"
        subtitle={`Game #${gameId} Summary`}
        showBack={true}
        onBack={() => router.replace('/play' as any)}
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner Card */}
        <View
          style={[
            styles.outcomeBanner,
            isWinner
              ? styles.outcomeWin
              : isLoser
              ? styles.outcomeLoss
              : styles.outcomeDraw,
          ]}
        >
          <Text style={styles.outcomeIcon}>{titleIcon}</Text>
          <Text style={styles.outcomeTitle}>{titleText}</Text>
          <Text style={styles.outcomeReason}>{formatEndReason()}</Text>
        </View>

        {/* Players Card */}
        <View style={styles.playersCard}>
          {/* White Player */}
          <View style={styles.playerRow}>
            <View style={styles.playerColorIcon}>
              <Text style={styles.pieceSym}>♔</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {game?.whitePlayer?.name || 'White Player'}
              </Text>
              <Text style={styles.playerSub}>White</Text>
            </View>
            <View style={styles.playerScore}>
              <Text style={styles.scoreText}>
                {game?.winnerId === game?.whitePlayerId ? '1' : isDraw ? '½' : '0'}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Black Player */}
          <View style={styles.playerRow}>
            <View style={[styles.playerColorIcon, styles.blackIconBox]}>
              <Text style={[styles.pieceSym, styles.blackPieceSym]}>♚</Text>
            </View>
            <View style={styles.playerInfo}>
              <Text style={styles.playerName}>
                {game?.gameType === 'PLAYER_VS_AI'
                  ? 'AI'
                  : game?.blackPlayer?.name || 'Black Player'}
              </Text>
              <Text style={styles.playerSub}>Black</Text>
            </View>
            <View style={styles.playerScore}>
              <Text style={styles.scoreText}>
                {game?.winnerId === game?.blackPlayerId ? '1' : isDraw ? '½' : '0'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsCol}>
          <TouchableOpacity
            style={styles.aiReviewBtn}
            activeOpacity={0.85}
            onPress={() => setAiReviewVisible(true)}
          >
            <Text style={styles.aiReviewBtnText}>✨ 🤖 AI Match Review & Move Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.85}
            onPress={() => router.push('/play/create' as any)}
          >
            <Text style={styles.primaryBtnText}>Play Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.75}
            onPress={() => router.replace('/play' as any)}
          >
            <Text style={styles.secondaryBtnText}>Back to Play Hub</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* AI Match Review Modal */}
      <AiReviewModal
        visible={aiReviewVisible}
        gameId={gameId}
        onClose={() => setAiReviewVisible(false)}
      />

      {/* Persistent Bottom Footer */}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
    backgroundColor: '#FFFFFF',
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
    color: '#194E40',
    lineHeight: 28,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202D29',
  },
  spacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  outcomeBanner: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  outcomeWin: {
    backgroundColor: '#E5EDDA',
    borderColor: '#C8D9BE',
  },
  outcomeLoss: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
  },
  outcomeDraw: {
    backgroundColor: '#EEF3E8',
    borderColor: '#D5DFC8',
  },
  outcomeIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  outcomeTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 4,
  },
  outcomeReason: {
    fontSize: 14,
    color: '#74817A',
    fontWeight: '600',
  },
  playersCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    marginBottom: 20,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  playerColorIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#EEF0E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  blackIconBox: {
    backgroundColor: '#194E40',
    borderWidth: 1,
    borderColor: '#194E40',
  },
  pieceSym: {
    fontSize: 22,
    color: '#202D29',
  },
  blackPieceSym: {
    color: '#FFFFFF',
  },
  playerInfo: {
    flex: 1,
  },
  playerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 2,
  },
  playerSub: {
    fontSize: 12,
    color: '#74817A',
  },
  playerScore: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EEF3E8',
    borderRadius: 8,
  },
  scoreText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#194E40',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E9E1',
    marginVertical: 14,
  },
  actionsCol: {
    gap: 12,
  },
  aiReviewBtn: {
    backgroundColor: '#194E40',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  aiReviewBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#EEF3E8',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  primaryBtnText: {
    color: '#194E40',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  secondaryBtnText: {
    color: '#74817A',
    fontSize: 16,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: '#74817A',
    marginTop: 14,
  },
});
