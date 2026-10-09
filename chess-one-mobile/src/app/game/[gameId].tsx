import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useGame } from '../../hooks/useGame';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { PlayerInfo } from '../../components/game/PlayerInfo';
import { MoveHistory } from '../../components/game/MoveHistory';
import { GameActions } from '../../components/game/GameActions';
import { PromotionModal } from '../../components/chess/PromotionModal';
import { DrawOfferModal } from '../../components/game/DrawOfferModal';
import { DrawConfirmModal } from '../../components/game/DrawConfirmModal';
import { ResignConfirmModal } from '../../components/game/ResignConfirmModal';
import { GameOverModal } from '../../components/game/GameOverModal';
import { GameAbortModal } from '../../components/game/GameAbortModal';
import { AiReviewModal } from '../../components/game/AiReviewModal';
import { useAuthStore } from '../../store/authStore';
import { gameSocket } from '../../socket/game.socket';
import { gameService } from '../../services/game.service';
import { PieceSymbol } from 'chess.js';

export default function LiveGameScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ gameId: string }>();
  const gameId = params.gameId ? parseInt(params.gameId, 10) : 0;
  const { user } = useAuthStore();

  const {
    game,
    status,
    fen,
    currentTurn,
    whiteTimeMs,
    blackTimeMs,
    moves,
    lastMove,
    result,
    winnerId,
    drawOfferFrom,
    connectionStatus,
    isLoading,
    error,
    userColor,
    currentUserId,
    boardOrientation,
    isMyTurn,
    selectedSquare,
    possibleMoves,
    inCheckSquare,
    pendingPromotion,
    handleSquarePress,
    confirmPromotion,
    cancelPromotion,
    resign,
    offerDraw,
    acceptDraw,
    rejectDraw,
  } = useGame(gameId);

  const [resignModalVisible, setResignModalVisible] = useState(false);
  const [drawModalVisible, setDrawModalVisible] = useState(false);
  const [drawFeedbackText, setDrawFeedbackText] = useState<string | null>(null);
  const [invertedOrientation, setInvertedOrientation] = useState(false);
  const [gameOverModalVisible, setGameOverModalVisible] = useState(false);
  const [aiReviewModalVisible, setAiReviewModalVisible] = useState(false);

  // Auto-abort timers & modal states
  const [abortCountdown, setAbortCountdown] = useState<number | null>(null);
  const [abortReason, setAbortReason] = useState<'FIRST_MOVE_TIMEOUT' | 'DISCONNECTED'>('FIRST_MOVE_TIMEOUT');
  const [abortModalVisible, setAbortModalVisible] = useState(false);
  const [abortModalReason, setAbortModalReason] = useState<string>('FIRST_MOVE_TIMEOUT');

  // Trigger auto-abort on server/socket and open modal
  const handleAutoAbort = async (reason: 'FIRST_MOVE_TIMEOUT' | 'DISCONNECTED') => {
    try {
      gameSocket.abortGameSocket(gameId, reason);
      await gameService.abortGame(gameId, reason);
    } catch (err) {
      console.warn('[handleAutoAbort] error:', err);
    } finally {
      setAbortCountdown(null);
      setAbortModalReason(reason);
      setAbortModalVisible(true);
    }
  };

  // 1. Initial 10-second first-move auto-abort countdown
  useEffect(() => {
    // Only active during match start before any moves are played
    if (status !== 'ACTIVE' || moves.length > 0) {
      if (abortReason === 'FIRST_MOVE_TIMEOUT') {
        setAbortCountdown(null);
      }
      return;
    }

    setAbortCountdown(10);
    setAbortReason('FIRST_MOVE_TIMEOUT');

    const interval = setInterval(() => {
      setAbortCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(interval);
          handleAutoAbort('FIRST_MOVE_TIMEOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status, moves.length, gameId]);

  // 2. Disconnect / Internet lost 10-second auto-abort countdown
  useEffect(() => {
    if (status !== 'ACTIVE') return;

    if (connectionStatus === 'disconnected') {
      setAbortCountdown(10);
      setAbortReason('DISCONNECTED');

      const interval = setInterval(() => {
        setAbortCountdown((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(interval);
            handleAutoAbort('DISCONNECTED');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else if (abortReason === 'DISCONNECTED') {
      // Reconnected!
      setAbortCountdown(null);
    }
  }, [connectionStatus, status]);

  // 3. Real-time socket listener for game:aborted event
  useEffect(() => {
    const unsubAbort = gameSocket.onGameAborted((payload: any) => {
      console.log('[LiveGameScreen] Game aborted via socket event:', payload);
      setAbortCountdown(null);
      setAbortModalReason(payload?.reason || 'FIRST_MOVE_TIMEOUT');
      setAbortModalVisible(true);
    });

    return () => {
      unsubAbort();
    };
  }, []);

  // 4. If status is CANCELLED (e.g. from polling), display abort modal
  useEffect(() => {
    if (status === 'CANCELLED' && !gameOverModalVisible) {
      setAbortCountdown(null);
      setAbortModalVisible(true);
    }
  }, [status, gameOverModalVisible]);

  // Reset GameOver modal whenever switching gameId
  useEffect(() => {
    setGameOverModalVisible(false);
    setAbortModalVisible(false);
    setDrawFeedbackText(null);
  }, [gameId]);

  // Show GameOver modal ONLY when this match is finished / completed
  useEffect(() => {
    if (
      status === 'COMPLETED' &&
      Boolean(result) &&
      game?.id === gameId
    ) {
      setGameOverModalVisible(true);
    } else {
      setGameOverModalVisible(false);
    }
  }, [status, result, game?.id, gameId]);

  const handleBackPress = () => {
    if (status === 'ACTIVE') {
      if (typeof window !== 'undefined' && window.confirm) {
        if (window.confirm('Leave Live Game?\n\nThis match is still active. If you leave, your clock will keep running.')) {
          router.replace('/play' as any);
        }
        return;
      }
      Alert.alert(
        'Leave Live Game?',
        'This match is still active. If you leave, your clock will keep running.',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Leave Game', style: 'destructive', onPress: () => router.replace('/play' as any) },
        ]
      );
    } else {
      router.replace('/play' as any);
    }
  };

  const handleConfirmResign = async () => {
    setResignModalVisible(false);
    await resign();
  };

  const handleOfferDraw = () => {
    setDrawModalVisible(true);
  };

  const handleConfirmDrawOffer = async () => {
    setDrawModalVisible(false);
    try {
      await offerDraw();
      setDrawFeedbackText('🤝 Draw offer sent! Waiting for opponent...');
      setTimeout(() => setDrawFeedbackText(null), 5000);
    } catch (err: any) {
      console.warn('[handleOfferDraw] failed:', err);
    }
  };

  if (error && !game) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could not load game</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            activeOpacity={0.8}
            onPress={() => router.replace('/play' as any)}
          >
            <Text style={styles.retryButtonText}>Return to Play Hub</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Determine which player is top vs bottom based on user's color orientation
  const isUserWhite = userColor === 'WHITE';
  const effectiveOrientation: 'w' | 'b' = invertedOrientation
    ? boardOrientation === 'w'
      ? 'b'
      : 'w'
    : boardOrientation;

  // Top player is opponent, bottom player is user
  const topPlayer = isUserWhite ? game?.blackPlayer : game?.whitePlayer;
  const topPlayerColor = isUserWhite ? 'BLACK' : 'WHITE';
  const topPlayerTime = isUserWhite ? blackTimeMs : whiteTimeMs;
  const topPlayerIsTurn = currentTurn === topPlayerColor;
  const topPlayerIsAI = game?.gameType === 'PLAYER_VS_AI' && !isUserWhite ? false : game?.gameType === 'PLAYER_VS_AI';
  const topPlayerFallback = topPlayerIsAI
    ? `Stockfish AI (${game?.aiDifficulty || 'Standard'})`
    : isUserWhite
    ? 'Opponent (Black)'
    : 'Opponent (White)';

  const bottomPlayer = isUserWhite ? game?.whitePlayer : game?.blackPlayer;
  const bottomPlayerColor = isUserWhite ? 'WHITE' : 'BLACK';
  const bottomPlayerTime = isUserWhite ? whiteTimeMs : blackTimeMs;
  const bottomPlayerIsTurn = currentTurn === bottomPlayerColor;
  const bottomPlayerFallback = isUserWhite ? 'You (White)' : 'You (Black)';

  const isCheckForTop = Boolean(inCheckSquare && topPlayerIsTurn);
  const isCheckForBottom = Boolean(inCheckSquare && bottomPlayerIsTurn);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconBtn}
          activeOpacity={0.7}
          onPress={handleBackPress}
        >
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerGameType}>
            {game?.gameType === 'PLAYER_VS_AI' ? '🤖 Play vs AI' : 'Live Match'}
          </Text>
          <Text style={styles.headerSubtitle}>
            {game?.timeControl} • {game?.gameCode ? `#${game.gameCode}` : `Match #${gameId}`}
          </Text>
        </View>

        {/* Socket Status Badge */}
        <View
          style={[
            styles.connBadge,
            connectionStatus === 'connected'
              ? styles.connBadgeOnline
              : connectionStatus === 'connecting'
              ? styles.connBadgeConnecting
              : styles.connBadgeOffline,
          ]}
        >
          <View
            style={[
              styles.connDot,
              connectionStatus === 'connected'
                ? styles.dotOnline
                : connectionStatus === 'connecting'
                ? styles.dotConnecting
                : styles.dotOffline,
            ]}
          />
          <Text style={styles.connText}>
            {connectionStatus === 'connected'
              ? 'Live'
              : connectionStatus === 'connecting'
              ? 'Connecting'
              : 'Offline'}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Opponent Card (Top) */}
        <View style={styles.playerSection}>
          <PlayerInfo
            player={topPlayer}
            nameFallback={topPlayerFallback}
            color={topPlayerColor}
            timeMs={topPlayerTime}
            isTurn={topPlayerIsTurn && status === 'ACTIVE'}
            isCheck={isCheckForTop}
            isAI={topPlayerIsAI}
          />
        </View>

        {/* Chess Board */}
        <View style={styles.boardWrapper}>
          <ChessBoard
            fen={fen}
            selectedSquare={selectedSquare}
            possibleMoves={possibleMoves}
            lastMove={lastMove ? { from: lastMove.from as any, to: lastMove.to as any } : null}
            inCheckSquare={inCheckSquare}
            onSquarePress={handleSquarePress}
            orientation={effectiveOrientation}
          />
        </View>

        {/* Turn Status Pill */}
        {status === 'ACTIVE' && (
          <View
            style={[
              styles.turnStatusBanner,
              isMyTurn ? styles.turnStatusMyTurn : styles.turnStatusOpponentTurn,
            ]}
          >
            <View
              style={[
                styles.turnStatusDot,
                isMyTurn ? styles.turnDotMyTurn : styles.turnDotOpponentTurn,
              ]}
            />
            <Text
              style={[
                styles.turnStatusText,
                isMyTurn ? styles.turnTextMyTurn : styles.turnTextOpponentTurn,
              ]}
            >
              {isMyTurn
                ? `Your Turn (${userColor === 'WHITE' ? 'White' : 'Black'}) — Select a piece to move`
                : `Opponent's Turn (${currentTurn === 'WHITE' ? 'White' : 'Black'}) — Waiting for move...`}
            </Text>
          </View>
        )}

        {/* Small Circle Abort Countdown Timer */}
        {abortCountdown !== null && abortCountdown > 0 && status === 'ACTIVE' && (
          <View style={styles.abortTimerContainer}>
            <View
              style={[
                styles.abortCircle,
                abortCountdown <= 3 ? styles.abortCircleUrgent : null,
              ]}
            >
              <Text
                style={[
                  styles.abortCircleText,
                  abortCountdown <= 3 ? styles.abortCircleTextUrgent : null,
                ]}
              >
                {abortCountdown}
              </Text>
            </View>
            <View style={styles.abortTextCol}>
              <Text style={styles.abortTimerTitle}>
                {abortReason === 'DISCONNECTED' ? '📡 Connection Lost' : '⏱️ Auto-Abort Countdown'}
              </Text>
              <Text style={styles.abortTimerSub}>
                {abortReason === 'DISCONNECTED'
                  ? `Reconnecting... Game aborts in ${abortCountdown}s`
                  : `First move required in ${abortCountdown}s or match aborts`}
              </Text>
            </View>
          </View>
        )}

        {/* Draw Feedback Banner */}
        {drawFeedbackText && (
          <View style={styles.drawFeedbackBanner}>
            <Text style={styles.drawFeedbackText}>{drawFeedbackText}</Text>
          </View>
        )}

        {/* You Card (Bottom) */}
        <View style={styles.playerSection}>
          <PlayerInfo
            player={bottomPlayer}
            nameFallback={bottomPlayerFallback}
            color={bottomPlayerColor}
            timeMs={bottomPlayerTime}
            isTurn={bottomPlayerIsTurn && status === 'ACTIVE'}
            isCheck={isCheckForBottom}
            isAI={false}
          />
        </View>

        {/* Move History & In-Game Chat Tabs */}
        <View style={styles.historySection}>
          <MoveHistory
            moves={moves}
            gameId={gameId}
            currentUserId={currentUserId || (user?.id ? parseInt(String(user.id), 10) : null)}
            currentUserName={user?.name || (user?.email ? user.email.split('@')[0] : 'You')}
            opponentName={topPlayer?.name || (topPlayerIsAI ? 'Stockfish AI' : 'Opponent')}
            isAI={topPlayerIsAI}
          />
        </View>

        {/* Live Controls or Match Over Bar */}
        <View style={styles.actionsSection}>
          {status === 'COMPLETED' || result ? (
            <View style={styles.completedActionsBar}>
              <TouchableOpacity
                style={styles.aiReviewActionBtn}
                activeOpacity={0.8}
                onPress={() => setAiReviewModalVisible(true)}
              >
                <Text style={styles.aiReviewActionBtnText}>
                  ✨ 🤖 AI Match Review & Move Analysis
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.viewResultBtn}
                activeOpacity={0.8}
                onPress={() => router.replace(`/game/result/${gameId}` as any)}
              >
                <Text style={styles.viewResultBtnText}>
                  📊 View Match Result ({result === 'TIMEOUT' ? 'Time Finished' : result || 'Completed'})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.reopenModalBtn}
                activeOpacity={0.8}
                onPress={() => setGameOverModalVisible(true)}
              >
                <Text style={styles.reopenModalBtnText}>🔔 Show Game Over Details</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <GameActions
              onOfferDraw={handleOfferDraw}
              onResign={() => setResignModalVisible(true)}
              onFlipBoard={() => setInvertedOrientation((prev) => !prev)}
              disabled={status !== 'ACTIVE'}
            />
          )}
        </View>
      </ScrollView>

      {/* Pawn Promotion Modal */}
      <PromotionModal
        visible={Boolean(pendingPromotion)}
        color={userColor === 'BLACK' ? 'b' : 'w'}
        onSelect={(piece: PieceSymbol) =>
          confirmPromotion(piece as 'q' | 'r' | 'b' | 'n')
        }
        onCancel={cancelPromotion}
      />

      {/* Opponent Offered Draw Modal */}
      <DrawOfferModal
        visible={Boolean(drawOfferFrom && drawOfferFrom === (isUserWhite ? 'BLACK' : 'WHITE'))}
        opponentName={topPlayer?.name || 'Your opponent'}
        onAccept={acceptDraw}
        onDecline={rejectDraw}
      />

      {/* Sender Draw Offer Confirm Modal */}
      <DrawConfirmModal
        visible={drawModalVisible}
        onConfirm={handleConfirmDrawOffer}
        onCancel={() => setDrawModalVisible(false)}
      />

      {/* Resign Confirm Modal */}
      <ResignConfirmModal
        visible={resignModalVisible}
        onConfirm={handleConfirmResign}
        onCancel={() => setResignModalVisible(false)}
      />

      {/* Game Over Popup Modal */}
      <GameOverModal
        visible={
          gameOverModalVisible &&
          status === 'COMPLETED' &&
          Boolean(result) &&
          Boolean(game && game.id === gameId)
        }
        result={result}
        winnerId={winnerId ?? null}
        userColor={userColor}
        currentUserId={currentUserId || (user?.id ? parseInt(String(user.id), 10) : null)}
        game={game}
        onAiReview={() => {
          setGameOverModalVisible(false);
          setAiReviewModalVisible(true);
        }}
        onViewResults={() => {
          setGameOverModalVisible(false);
          router.replace(`/game/result/${gameId}` as any);
        }}
        onPlayAgain={() => {
          setGameOverModalVisible(false);
          if (game?.gameType === 'PLAYER_VS_AI') {
            router.replace('/play/create?mode=ai' as any);
          } else {
            router.replace('/play/create' as any);
          }
        }}
        onGoHome={() => {
          setGameOverModalVisible(false);
          router.replace('/play' as any);
        }}
        onClose={() => setGameOverModalVisible(false)}
      />

      {/* Game Aborted Popup Modal */}
      <GameAbortModal
        visible={abortModalVisible}
        reason={abortModalReason}
        onGoHome={() => {
          setAbortModalVisible(false);
          router.replace('/play' as any);
        }}
        onNewMatch={() => {
          setAbortModalVisible(false);
          router.replace('/play/create' as any);
        }}
      />

      {/* AI Game Review Modal */}
      <AiReviewModal
        visible={aiReviewModalVisible}
        gameId={gameId}
        onClose={() => setAiReviewModalVisible(false)}
        onViewFullResults={() => {
          setAiReviewModalVisible(false);
          router.replace(`/game/result/${gameId}` as any);
        }}
      />
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.white,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 26,
    color: COLORS.textHeading,
    lineHeight: 28,
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerGameType: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 1,
  },
  connBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
  },
  connBadgeOnline: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  connBadgeConnecting: {
    backgroundColor: '#78350F',
    borderColor: '#D97706',
  },
  connBadgeOffline: {
    backgroundColor: '#451A03',
    borderColor: '#DC2626',
  },
  connDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  dotOnline: {
    backgroundColor: '#34D399',
  },
  dotConnecting: {
    backgroundColor: '#FBBF24',
  },
  dotOffline: {
    backgroundColor: '#F87171',
  },
  connText: {
    color: COLORS.textHeading,
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    paddingBottom: 28,
  },
  playerSection: {
    width: '100%',
    marginVertical: 4,
  },
  boardWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  historySection: {
    width: '100%',
    marginTop: 10,
  },
  actionsSection: {
    width: '100%',
    marginTop: 8,
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    color: COLORS.textBody,
    marginTop: 14,
  },
  errorIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryButtonText: {
    color: COLORS.textHeading,
    fontSize: 15,
    fontWeight: '700',
  },
  completedActionsBar: {
    width: '100%',
    gap: 8,
    marginVertical: 4,
  },
  aiReviewActionBtn: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#818CF8',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  aiReviewActionBtnText: {
    color: COLORS.textHeading,
    fontSize: 15,
    fontWeight: '800',
  },
  viewResultBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  viewResultBtnText: {
    color: COLORS.textHeading,
    fontSize: 15,
    fontWeight: '700',
  },
  reopenModalBtn: {
    backgroundColor: COLORS.border,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  reopenModalBtnText: {
    color: COLORS.textBody,
    fontSize: 13,
    fontWeight: '600',
  },
  turnStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginVertical: 6,
    alignSelf: 'center',
  },
  turnStatusMyTurn: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22C55E',
  },
  turnStatusOpponentTurn: {
    backgroundColor: 'rgba(55, 65, 81, 0.5)',
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  turnStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  turnDotMyTurn: {
    backgroundColor: '#22C55E',
  },
  turnDotOpponentTurn: {
    backgroundColor: '#9CA3AF',
  },
  turnStatusText: {
    fontSize: 13,
    fontWeight: '700',
  },
  turnTextMyTurn: {
    color: '#4ADE80',
  },
  turnTextOpponentTurn: {
    color: '#D1D5DB',
  },
  drawFeedbackBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignSelf: 'center',
    marginVertical: 4,
  },
  drawFeedbackText: {
    color: '#93C5FD',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  abortTimerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C150B',
    borderWidth: 1.5,
    borderColor: '#D97706',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginVertical: 6,
    alignSelf: 'center',
    width: '92%',
    gap: 12,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  abortCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    borderWidth: 2.5,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  abortCircleUrgent: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#EF4444',
  },
  abortCircleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FDE047',
    textAlign: 'center',
  },
  abortCircleTextUrgent: {
    color: '#F87171',
  },
  abortTextCol: {
    flex: 1,
  },
  abortTimerTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#F59E0B',
    marginBottom: 2,
  },
  abortTimerSub: {
    fontSize: 11,
    color: '#FEF08A',
    lineHeight: 15,
  },
});
