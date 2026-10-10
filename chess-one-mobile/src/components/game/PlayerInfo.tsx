import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { GamePlayer, PlayerColor } from '../../types/game.types';
import { GameClock } from './GameClock';

interface PlayerInfoProps {
  player?: GamePlayer | null;
  nameFallback: string;
  color: PlayerColor;
  timeMs: number | null | undefined;
  isTurn: boolean;
  isCheck?: boolean;
  isAI?: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  nameFallback,
  color,
  timeMs,
  isTurn,
  isCheck = false,
  isAI = false,
}) => {
  const displayName = player?.name || nameFallback;
  const initial = displayName[0]?.toUpperCase() || 'P';
  const isWhite = color === 'WHITE';

  return (
    <View style={[styles.container, isTurn && styles.activeContainer]}>
      {/* Avatar / Initial */}
      <View style={styles.leftSection}>
        {player?.avatarUrl ? (
          <Image source={{ uri: player.avatarUrl }} style={styles.avatarImage} />
        ) : (
          <View style={[styles.avatarPlaceholder, isWhite ? styles.whiteBadge : styles.blackBadge]}>
            <Text style={[styles.avatarText, isWhite ? styles.whiteBadgeText : styles.blackBadgeText]}>
              {isAI ? '🤖' : initial}
            </Text>
          </View>
        )}

        <View style={styles.metaSection}>
          <View style={styles.nameRow}>
            <Text style={styles.playerName} numberOfLines={1}>
              {displayName}
            </Text>
            <View style={[styles.colorChip, isWhite ? styles.whiteChip : styles.blackChip]}>
              <Text style={[styles.colorChipText, isWhite ? styles.whiteChipText : styles.blackChipText]}>
                {isWhite ? 'White' : 'Black'}
              </Text>
            </View>
          </View>

          {isCheck ? (
            <View style={styles.checkBadge}>
              <Text style={styles.checkText}>IN CHECK</Text>
            </View>
          ) : timeMs === 0 ? (
            <View style={styles.timeoutBadge}>
              <Text style={styles.timeoutText}>TIME EXPIRED</Text>
            </View>
          ) : isAI && isTurn ? (
            <Text style={styles.turnLabel}>Thinking...</Text>
          ) : isTurn ? (
            <Text style={styles.yourTurnLabel}>Your Turn</Text>
          ) : null}
        </View>
      </View>

      {/* Clock */}
      <GameClock timeMs={timeMs} isActive={isTurn} color={color} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  activeContainer: {
    borderColor: COLORS.primary,
    backgroundColor: '#F8FAF7',
    borderWidth: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 8,
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  whiteBadge: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  blackBadge: {
    backgroundColor: '#1E293B',
    borderColor: '#0F172A',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  whiteBadgeText: {
    color: '#0F172A',
  },
  blackBadgeText: {
    color: '#FFFFFF',
  },
  metaSection: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
    maxWidth: 140,
  },
  colorChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  whiteChip: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  blackChip: {
    backgroundColor: '#1E293B',
    borderColor: '#0F172A',
  },
  colorChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  whiteChipText: {
    color: '#475569',
  },
  blackChipText: {
    color: '#FFFFFF',
  },
  turnLabel: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginTop: 2,
  },
  yourTurnLabel: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  checkBadge: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  checkText: {
    color: '#B91C1C',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeoutBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  timeoutText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
