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
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    minWidth: 84,
    justifyContent: 'center',
  },
  activeClockContainer: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  lowTimeClockContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  inactiveDot: {
    backgroundColor: '#94A3B8',
  },
  activeDot: {
    backgroundColor: '#2563EB',
  },
  lowTimeDot: {
    backgroundColor: '#EF4444',
  },
  clockText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  activeClockText: {
    color: '#1E3A8A',
  },
  lowTimeClockText: {
    color: '#DC2626',
  },
});
