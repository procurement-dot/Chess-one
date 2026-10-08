import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Image,
} from 'react-native';
import { gameService } from '../../services/game.service';
import { AiReviewResponse } from '../../types/game.types';

const logoIcon = require('../../../assets/images/chessone-icon.png');

interface AiReviewModalProps {
  visible: boolean;
  gameId: number | string;
  onClose: () => void;
  onViewFullResults?: () => void;
}

export const AiReviewModal: React.FC<AiReviewModalProps> = ({
  visible,
  gameId,
  onClose,
  onViewFullResults,
}) => {
  const [review, setReview] = useState<AiReviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !gameId) return;

    let isMounted = true;
    async function fetchReview() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await gameService.getAiReview(gameId);
        if (isMounted) {
          setReview(data);
        }
      } catch (err: any) {
        if (isMounted) {
          const msg =
            err.userFriendlyMessage ||
            err.message ||
            'Unable to generate AI review. Please check your connection.';
          setError(msg);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchReview();
    return () => {
      isMounted = false;
    };
  }, [visible, gameId]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetCard} onPress={(e) => e.stopPropagation()}>
          {/* Header Bar */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Image
                source={logoIcon}
                style={styles.aiLogoIcon}
                resizeMode="contain"
              />
              <View>
                <Text style={styles.headerTitle}>AI Game Review</Text>
                <Text style={styles.headerSubtitle}>ChessOne AI • Move Analysis</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Loading State */}
          {isLoading && (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#194E40" />
              <Text style={styles.loadingTitle}>Analyzing Every Move...</Text>
              <Text style={styles.loadingSubtitle}>
                AI is evaluating accuracy, tactical opportunities, and blunders.
              </Text>
            </View>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <View style={styles.centerContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorTitle}>Analysis Unavailable</Text>
              <Text style={styles.errorSubtitle}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                  gameService.getAiReview(gameId).then(setReview).catch((e) => setError(e.message)).finally(() => setIsLoading(false));
                }}
              >
                <Text style={styles.retryBtnText}>🔄 Retry Analysis</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Review Content */}
          {!isLoading && review && (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Verdict Banner */}
              <View style={styles.verdictCard}>
                <View style={styles.verdictHeader}>
                  <Text style={styles.verdictTag}>MATCH VERDICT</Text>
                  <View style={styles.coachRatingPill}>
                    <Text style={styles.coachRatingText}>{review.coachRating || 'Casual'}</Text>
                  </View>
                </View>
                <Text style={styles.verdictTitle}>{review.verdict}</Text>
                <Text style={styles.summaryText}>{review.summary}</Text>

                {/* Accuracy Row */}
                <View style={styles.accuracyGrid}>
                  <View style={styles.accuracyBox}>
                    <Text style={styles.accuracyLabel}>White Accuracy</Text>
                    <Text style={[styles.accuracyValue, { color: '#194E40' }]}>
                      {review.accuracyWhite}%
                    </Text>
                  </View>
                  <View style={styles.accuracyDivider} />
                  <View style={styles.accuracyBox}>
                    <Text style={styles.accuracyLabel}>Black Accuracy</Text>
                    <Text style={[styles.accuracyValue, { color: '#202D29' }]}>
                      {review.accuracyBlack}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* Best Moves Section */}
              {review.bestMoves && review.bestMoves.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>🌟</Text>
                    <Text style={styles.sectionTitle}>Best Moves</Text>
                  </View>

                  {review.bestMoves.map((bm, idx) => (
                    <View key={`bm-${idx}`} style={styles.bestMoveCard}>
                      <View style={styles.moveHeaderRow}>
                        <View style={styles.moveBadgeGreen}>
                          <Text style={styles.moveBadgeGreenText}>
                            #{bm.moveNumber} • {bm.player} ({bm.san})
                          </Text>
                        </View>
                        <Text style={styles.moveTitleText}>{bm.title}</Text>
                      </View>
                      <Text style={styles.moveExplanationText}>{bm.explanation}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Worst Moves / Mistakes Section */}
              {review.worstMoves && review.worstMoves.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>⚠️</Text>
                    <Text style={styles.sectionTitle}>Mistakes & Missed Chances</Text>
                  </View>

                  {review.worstMoves.map((wm, idx) => (
                    <View key={`wm-${idx}`} style={styles.worstMoveCard}>
                      <View style={styles.moveHeaderRow}>
                        <View style={styles.moveBadgeAmber}>
                          <Text style={styles.moveBadgeAmberText}>
                            #{wm.moveNumber} • {wm.player} ({wm.san})
                          </Text>
                        </View>
                        <Text style={styles.moveTitleText}>{wm.title}</Text>
                      </View>
                      <Text style={styles.moveExplanationText}>{wm.explanation}</Text>
                      {wm.betterMove && (
                        <View style={styles.betterMoveBox}>
                          <Text style={styles.betterMoveLabel}>💡 Better Move: </Text>
                          <Text style={styles.betterMoveValue}>{wm.betterMove}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Key Turning Point */}
              {review.turningPoint && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionIcon}>🔄</Text>
                    <Text style={styles.sectionTitle}>Turning Point</Text>
                  </View>
                  <View style={styles.turningPointCard}>
                    <Text style={styles.turningPointText}>{review.turningPoint}</Text>
                  </View>
                </View>
              )}

              {/* Coach Takeaway Tip */}
              {review.keyTakeaway && (
                <View style={styles.tipCard}>
                  <View style={styles.tipHeaderRow}>
                    <Text style={styles.tipIcon}>💡</Text>
                    <Text style={styles.tipTitle}>Grandmaster Advice for Next Match</Text>
                  </View>
                  <Text style={styles.tipText}>{review.keyTakeaway}</Text>
                </View>
              )}

              {/* Bottom Buttons */}
              <View style={styles.bottomButtonGroup}>
                {onViewFullResults && (
                  <TouchableOpacity
                    style={styles.fullResultsBtn}
                    activeOpacity={0.8}
                    onPress={onViewFullResults}
                  >
                    <Text style={styles.fullResultsBtnText}>📊 View Result Overview</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeDoneBtn}
                  activeOpacity={0.8}
                  onPress={onClose}
                >
                  <Text style={styles.closeDoneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(32, 45, 41, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetCard: {
    width: '100%',
    maxHeight: '90%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 18,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiLogoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202D29',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#74817A',
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#74817A',
    fontSize: 14,
    fontWeight: '700',
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingTitle: {
    marginTop: 18,
    fontSize: 17,
    fontWeight: '700',
    color: '#202D29',
  },
  loadingSubtitle: {
    marginTop: 8,
    fontSize: 13,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  errorIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#C53030',
  },
  errorSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#74817A',
    textAlign: 'center',
    marginBottom: 18,
  },
  retryBtn: {
    backgroundColor: '#194E40',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  scrollArea: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  verdictCard: {
    backgroundColor: '#EEF3E8',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  verdictHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  verdictTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#194E40',
    letterSpacing: 1,
  },
  coachRatingPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  coachRatingText: {
    color: '#194E40',
    fontSize: 11,
    fontWeight: '700',
  },
  verdictTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202D29',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#202D29',
    lineHeight: 20,
    marginBottom: 16,
  },
  accuracyGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  accuracyBox: {
    flex: 1,
    alignItems: 'center',
  },
  accuracyDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E4E9E1',
  },
  accuracyLabel: {
    fontSize: 11,
    color: '#74817A',
    fontWeight: '600',
    marginBottom: 4,
  },
  accuracyValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  section: {
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    fontSize: 18,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202D29',
  },
  bestMoveCard: {
    backgroundColor: 'rgba(214, 239, 158, 0.35)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  worstMoveCard: {
    backgroundColor: 'rgba(252, 237, 223, 0.7)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F7A18C',
  },
  moveHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  moveBadgeGreen: {
    backgroundColor: '#194E40',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moveBadgeGreenText: {
    color: '#D6EF9E',
    fontSize: 11,
    fontWeight: '800',
  },
  moveBadgeAmber: {
    backgroundColor: '#C53030',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  moveBadgeAmberText: {
    color: '#FCEDDF',
    fontSize: 11,
    fontWeight: '800',
  },
  moveTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202D29',
    flex: 1,
  },
  moveExplanationText: {
    fontSize: 13,
    color: '#202D29',
    lineHeight: 18,
  },
  betterMoveBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F7A18C',
  },
  betterMoveLabel: {
    fontSize: 12,
    color: '#C53030',
    fontWeight: '700',
  },
  betterMoveValue: {
    fontSize: 12,
    color: '#202D29',
    fontWeight: '700',
  },
  turningPointCard: {
    backgroundColor: '#F5F7F2',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  turningPointText: {
    fontSize: 13,
    color: '#202D29',
    lineHeight: 19,
  },
  tipCard: {
    backgroundColor: '#EEF3E8',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  tipHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  tipIcon: {
    fontSize: 18,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#194E40',
  },
  tipText: {
    fontSize: 13,
    color: '#202D29',
    lineHeight: 19,
  },
  bottomButtonGroup: {
    gap: 10,
    marginTop: 10,
  },
  fullResultsBtn: {
    backgroundColor: '#194E40',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  fullResultsBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeDoneBtn: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  closeDoneBtnText: {
    color: '#74817A',
    fontSize: 14,
    fontWeight: '600',
  },
});
