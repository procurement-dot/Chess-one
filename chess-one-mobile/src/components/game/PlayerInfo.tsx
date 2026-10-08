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
  isCurrentUser?: boolean;
}

export const PlayerInfo: React.FC<PlayerInfoProps> = ({
  player,
  nameFallback,
  color,
  timeMs,
  isTurn,
  isCheck = false,
  isAI = false,
  isCurrentUser = false,
}) => {
  const displayName = isAI ? 'AI' : (player?.name || nameFallback);
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
          ) : isTurn ? (
            isCurrentUser ? (
              <View style={styles.yourTurnBadge}>
                <Text style={styles.yourTurnText}>Your Turn</Text>
              </View>
            ) : (
              <Text style={styles.turnLabel}>{isAI ? 'Thinking...' : "Opponent's Turn"}</Text>
            )
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    width: '100%',
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  activeContainer: {
    borderColor: '#194E40',
    backgroundColor: '#EEF3E8',
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
    borderColor: '#D5DFC8',
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
    backgroundColor: '#EEF0E0',
    borderColor: '#D5DFC8',
  },
  blackBadge: {
    backgroundColor: '#194E40',
    borderColor: '#194E40',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
  },
  whiteBadgeText: {
    color: '#202D29',
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
    color: '#202D29',
    maxWidth: 140,
  },
  colorChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  whiteChip: {
    backgroundColor: '#EEF0E0',
    borderColor: '#D5DFC8',
  },
  blackChip: {
    backgroundColor: '#194E40',
    borderColor: '#194E40',
  },
  colorChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  whiteChipText: {
    color: '#202D29',
  },
  blackChipText: {
    color: '#FFFFFF',
  },
  turnLabel: {
    fontSize: 11,
    color: '#194E40',
    fontWeight: '600',
    marginTop: 2,
  },
  checkBadge: {
    backgroundColor: '#FCEDDF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  checkText: {
    color: '#C53030',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timeoutBadge: {
    backgroundColor: '#FCEDDF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  timeoutText: {
    color: '#C53030',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  yourTurnBadge: {
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 2,
  },
  yourTurnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#137333',
    letterSpacing: 0.3,
  },
});
