import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GameClockProps {
  timeMs: number | null | undefined;
  isActive: boolean;
  color?: 'WHITE' | 'BLACK';
}

export const GameClock: React.FC<GameClockProps> = ({ timeMs, isActive }) => {
  const formatTime = (ms: number | null | undefined) => {
    if (ms === null || ms === undefined || ms < 0) return '--:--';
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const isLowTime = timeMs !== null && timeMs !== undefined && timeMs < 30000;

  return (
    <View
      style={[
        styles.clockContainer,
        isActive && styles.activeClockContainer,
        isLowTime && isActive && styles.lowTimeClockContainer,
      ]}
    >
      <View
        style={[
          styles.statusDot,
          isActive ? styles.activeDot : styles.inactiveDot,
          isLowTime && isActive && styles.lowTimeDot,
        ]}
      />
      <Text
        style={[
          styles.clockText,
          isActive && styles.activeClockText,
          isLowTime && isActive && styles.lowTimeClockText,
        ]}
      >
        {formatTime(timeMs)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  clockContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6ECDF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFC8',
    gap: 6,
    minWidth: 84,
    justifyContent: 'center',
  },
  activeClockContainer: {
    backgroundColor: '#E5EDDA',
    borderColor: '#194E40',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lowTimeClockContainer: {
    backgroundColor: '#FCEDDF',
    borderColor: '#F7A18C',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inactiveDot: {
    backgroundColor: '#74817A',
  },
  activeDot: {
    backgroundColor: '#194E40',
  },
  lowTimeDot: {
    backgroundColor: '#C53030',
  },
  clockText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#172B26',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  activeClockText: {
    color: '#194E40',
  },
  lowTimeClockText: {
    color: '#C53030',
  },
});
