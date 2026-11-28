import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES } from '../../constants/chessone-theme';
import { formatPairingResult } from '../../utils/tournament.utils';
import type { TournamentPairing } from '../../types/tournament.types';

interface PairingRowProps {
  pairing: TournamentPairing;
  currentUserId: number | null | undefined;
  onPressGame?: (gameId: number) => void;
}

export function PairingRow({ pairing, currentUserId, onPressGame }: PairingRowProps) {
  const router = useRouter();

  const isUserWhite = currentUserId != null && pairing.white.id === currentUserId;
  const isUserBlack = currentUserId != null && pairing.black?.id === currentUserId;
  const isUserInMatch = isUserWhite || isUserBlack;

  const isBye = pairing.black === null;
  const { text: resultText, isLive } = formatPairingResult(pairing.result, pairing.gameStatus);

  const handlePress = () => {
    if (pairing.gameId) {
      if (onPressGame) {
        onPressGame(pairing.gameId);
      } else {
        router.push(`/game/${pairing.gameId}` as any);
      }
    }
  };

  if (isBye) {
    return (
      <View style={[styles.container, isUserInMatch && styles.highlightedContainer]}>
        <View style={styles.boardBadge}>
          <Text style={styles.boardNumberText}>B{pairing.boardNumber}</Text>
        </View>

        <View style={styles.byeContent}>
          <Text style={[styles.playerName, isUserInMatch && styles.highlightedPlayerName]}>
            {pairing.white.name}{' '}
            <Text style={styles.playerRating}>({pairing.white.rating})</Text>
          </Text>
          <Text style={styles.byeText}>— BYE (+1 point)</Text>
        </View>

        <View style={styles.resultBadgeMuted}>
          <Text style={styles.resultBadgeMutedText}>BYE</Text>
        </View>
      </View>
    );
  }

  const isClickable = Boolean(pairing.gameId);

  return (
    <TouchableOpacity
      style={[styles.container, isUserInMatch && styles.highlightedContainer]}
      disabled={!isClickable}
      activeOpacity={0.7}
      onPress={handlePress}
    >
      <View style={styles.boardBadge}>
        <Text style={styles.boardNumberText}>B{pairing.boardNumber}</Text>
      </View>

      <View style={styles.matchupContent}>
        {/* White Player */}
        <View style={styles.playerColumn}>
          <View style={styles.whiteDot} />
          <Text
            numberOfLines={1}
            style={[
              styles.playerName,
              isUserWhite && styles.highlightedPlayerName,
            ]}
          >
            {pairing.white.name}
          </Text>
          <Text style={styles.playerRating}>({pairing.white.rating})</Text>
        </View>

        {/* VS Indicator */}
        <Text style={styles.vsText}>vs</Text>

        {/* Black Player */}
        <View style={styles.playerColumn}>
          <Text
            numberOfLines={1}
            style={[
              styles.playerName,
              isUserBlack && styles.highlightedPlayerName,
            ]}
          >
            {pairing.black?.name}
          </Text>
          <Text style={styles.playerRating}>({pairing.black?.rating})</Text>
          <View style={styles.blackDot} />
        </View>
      </View>

      {/* Result or Live Pill */}
      <View style={styles.resultContainer}>
        {isLive ? (
          <View style={styles.liveBadge}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>
        ) : (
          <Text style={styles.resultText}>{resultText}</Text>
        )}
        {isClickable && <Feather name="chevron-right" size={16} color={COLORS.textBody} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  highlightedContainer: {
    backgroundColor: '#F7FBEF',
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  boardBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  boardNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textBody,
  },
  matchupContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 8,
  },
  playerColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playerName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
    maxWidth: 90,
  },
  highlightedPlayerName: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  playerRating: {
    fontSize: 11,
    color: COLORS.textBody,
  },
  whiteDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#475569',
  },
  blackDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#0F172A',
  },
  vsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginHorizontal: 6,
  },
  byeContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  byeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    fontStyle: 'italic',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  resultText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  resultBadgeMuted: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  resultBadgeMutedText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
});
