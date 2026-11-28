import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, SHADOWS } from '../../constants/chessone-theme';
import { PuzzleItem, getInfinitePuzzles } from '../../data/learn/puzzlesData';
import { Feather } from '@expo/vector-icons';

interface TacticsAdventureMapProps {
  puzzles: PuzzleItem[];
  solvedPuzzles: string[];
  onSelectPuzzle: (puzzleId: string) => void;
}

export const TacticsAdventureMap: React.FC<TacticsAdventureMapProps> = ({
  puzzles,
  solvedPuzzles,
  onSelectPuzzle,
}) => {
  const [selectedPreviewPuzzle, setSelectedPreviewPuzzle] = useState<PuzzleItem | null>(null);

  // Dynamic active level tracking
  const firstUnsolvedIdx = puzzles.findIndex((p) => !solvedPuzzles.includes(p.id));
  const activeLevelIdx = firstUnsolvedIdx >= 0 ? firstUnsolvedIdx : solvedPuzzles.length;
  const activeLevelNumber = activeLevelIdx + 1;
  const totalStars = solvedPuzzles.length * 3;

  // Seamless Infinite Look-Ahead Trail:
  // The winding trail always displays at least 15 levels ahead of the current active level!
  // It NEVER terminates, no matter how many levels the student completes!
  const minDisplayCount = Math.max(puzzles.length, activeLevelIdx + 15, 25);
  const displayPuzzles = useMemo(() => {
    if (puzzles.length >= minDisplayCount) {
      return puzzles;
    }
    return getInfinitePuzzles(minDisplayCount);
  }, [puzzles, minDisplayCount]);

  const handleNodePress = (puzzle: PuzzleItem, isUnlocked: boolean) => {
    if (!isUnlocked) {
      return;
    }
    setSelectedPreviewPuzzle(puzzle);
  };

  return (
    <View style={styles.container}>
      {/* Sleek Minimal Map Header */}
      <View style={styles.mapHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.mapTitle}>Adventure Trail</Text>
        </View>

        {/* Endless Stars & Active Level Pill (No ceiling/total count exposed) */}
        <View style={styles.progressPill}>
          <Text style={{ fontSize: 13 }}>⭐</Text>
          <Text style={styles.progressPillText}>
            {totalStars} Stars · Level {activeLevelNumber}
          </Text>
        </View>
      </View>

      {/* Winding Trail Nodes */}
      <View style={styles.pathCanvas}>
        {displayPuzzles.map((puz, index) => {
          const isCompleted = solvedPuzzles.includes(puz.id);
          const isUnlocked = index <= activeLevelIdx;
          const isCurrent = index === activeLevelIdx && !isCompleted;
          const isMilestone = (index + 1) % 5 === 0;

          // S-curve sinusoidal offset (-95px to +95px)
          const offset = Math.round(Math.sin(index * 0.95) * 85);

          return (
            <View key={puz.id} style={styles.nodeContainer}>
              {/* Connector dots trail to previous node */}
              {index > 0 && (
                <View style={[styles.connectorTrail, { transform: [{ translateX: offset * 0.5 }] }]}>
                  <View style={styles.trailDot} />
                  <View style={styles.trailDot} />
                  <View style={styles.trailDot} />
                </View>
              )}

              {/* Node Button positioned on S-Curve */}
              <View style={[styles.nodeWrapper, { transform: [{ translateX: offset }] }]}>
                {/* Floating "PLAY" / Crown for active level */}
                {isCurrent && (
                  <View style={styles.currentFloatBadge}>
                    <Text style={styles.currentFloatText}>👑 PLAY</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.nodeCircle,
                    isCompleted && styles.nodeCircleCompleted,
                    isCurrent && styles.nodeCircleCurrent,
                    !isUnlocked && styles.nodeCircleLocked,
                  ]}
                  onPress={() => handleNodePress(puz, isUnlocked)}
                  activeOpacity={0.8}
                >
                  {isCompleted ? (
                    <Feather name="check" size={24} color={COLORS.white} />
                  ) : isCurrent ? (
                    <Text style={styles.nodeNumberCurrent}>{puz.number}</Text>
                  ) : isUnlocked ? (
                    <Text style={styles.nodeNumberUnlocked}>{puz.number}</Text>
                  ) : (
                    <Feather name="lock" size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>

                {/* Stars or Rating badge under node */}
                <View style={styles.nodeMeta}>
                  {isCompleted ? (
                    <View style={styles.starsRow}>
                      <Text style={styles.starIcon}>⭐</Text>
                      <Text style={styles.starIcon}>⭐</Text>
                      <Text style={styles.starIcon}>⭐</Text>
                    </View>
                  ) : isCurrent ? (
                    <View style={styles.currentMetaPill}>
                      <Text style={styles.currentMetaText}>{puz.rating} ELO</Text>
                    </View>
                  ) : (
                    <Text style={styles.lockedMetaText}>{puz.rating} ELO</Text>
                  )}
                </View>

                {/* Milestone Chest every 5 levels */}
                {isMilestone && (
                  <View style={styles.milestoneChestBox}>
                    <Text style={{ fontSize: 18 }}>🎁</Text>
                    <Text style={styles.milestoneText}>+50 XP</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Level Preview Modal */}
      {selectedPreviewPuzzle && (
        <Modal
          visible={!!selectedPreviewPuzzle}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedPreviewPuzzle(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <View style={styles.modalThemeRow}>
                  <Text style={styles.modalThemeBadge}>
                    {selectedPreviewPuzzle.theme.toUpperCase()}
                  </Text>
                  <Text style={styles.modalRatingBadge}>
                    {selectedPreviewPuzzle.rating} ELO
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSelectedPreviewPuzzle(null)}
                >
                  <Feather name="x" size={18} color={COLORS.textBody} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalTitle}>
                Level {selectedPreviewPuzzle.number}: {selectedPreviewPuzzle.title}
              </Text>
              <Text style={styles.modalSub}>{selectedPreviewPuzzle.subtitle}</Text>

              {/* Reward info */}
              <View style={styles.modalRewardBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 18 }}>⭐</Text>
                  <Text style={styles.modalRewardText}>
                    Earn up to +3 Stars & +{selectedPreviewPuzzle.xpReward} XP
                  </Text>
                </View>
                <Text style={styles.modalTurnText}>
                  {selectedPreviewPuzzle.turn === 'w' ? '⚪ White to Move' : '⚫ Black to Move'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalStartBtn}
                onPress={() => {
                  const targetId = selectedPreviewPuzzle.id;
                  setSelectedPreviewPuzzle(null);
                  onSelectPuzzle(targetId);
                }}
                activeOpacity={0.85}
              >
                <Feather name="play" size={18} color={COLORS.white} />
                <Text style={styles.modalStartBtnText}>Start Level {selectedPreviewPuzzle.number} 🚀</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingVertical: 12,
  },
  mapHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  mapEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.8,
  },
  mapTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#244535',
    marginTop: 2,
  },
  mapSubtitle: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 2,
  },
  progressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  progressPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  pathCanvas: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  nodeContainer: {
    alignItems: 'center',
    width: '100%',
    marginVertical: 10,
  },
  connectorTrail: {
    alignItems: 'center',
    gap: 6,
    marginVertical: 4,
  },
  trailDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C6D2BC',
  },
  nodeWrapper: {
    alignItems: 'center',
    position: 'relative',
  },
  currentFloatBadge: {
    position: 'absolute',
    top: -16,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    zIndex: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  currentFloatText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  nodeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  nodeCircleCompleted: {
    backgroundColor: '#244535',
    borderColor: '#436A55',
  },
  nodeCircleCurrent: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
    transform: [{ scale: 1.08 }],
  },
  nodeCircleLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  nodeNumberCurrent: {
    fontSize: 20,
    fontWeight: '900',
    color: '#92400E',
  },
  nodeNumberUnlocked: {
    fontSize: 18,
    fontWeight: '800',
    color: '#244535',
  },
  nodeMeta: {
    marginTop: 6,
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starIcon: {
    fontSize: 11,
  },
  currentMetaPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  currentMetaText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  lockedMetaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  milestoneChestBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginTop: 4,
  },
  milestoneText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#B45309',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    gap: 12,
    ...SHADOWS.soft,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalThemeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalThemeBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalRatingBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#244535',
    backgroundColor: '#EAEFE6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
  },
  modalRewardBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 12,
    padding: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#F3E8D6',
  },
  modalRewardText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#244535',
  },
  modalTurnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modalStartBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#244535',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 6,
  },
  modalStartBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
