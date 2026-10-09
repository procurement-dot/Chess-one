import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MovePair } from '../../types/chess.types';

interface MoveHistoryProps {
  movePairs: MovePair[];
}

export const MoveHistory: React.FC<MoveHistoryProps> = ({ movePairs }) => {
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Scroll to the end whenever a new move is made
    if (movePairs.length > 0) {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  }, [movePairs.length]);

  if (movePairs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No moves yet. White to make the first move.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.headerText}>Move History ({movePairs.length})</Text>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        nestedScrollEnabled
        showsVerticalScrollIndicator={true}
      >
        {movePairs.map((pair, index) => {
          const isLatestMove = index === movePairs.length - 1;
          return (
            <View
              key={pair.moveNumber}
              style={[
                styles.row,
                index % 2 === 1 && styles.alternateRow,
                isLatestMove && styles.highlightRow,
              ]}
            >
              <Text style={styles.moveNumberText}>{pair.moveNumber}.</Text>
              <View style={styles.moveCell}>
                <Text
                  style={[
                    styles.moveText,
                    isLatestMove && !pair.black && styles.activeMoveText,
                  ]}
                >
                  {pair.white}
                </Text>
              </View>
              <View style={styles.moveCell}>
                <Text
                  style={[
                    styles.moveText,
                    isLatestMove && Boolean(pair.black) && styles.activeMoveText,
                  ]}
                >
                  {pair.black || ''}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F3642',
    overflow: 'hidden',
    height: 120,
    width: '100%',
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2F3642',
    backgroundColor: '#171B20',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 4,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2F3642',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    width: '100%',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 13,
    fontStyle: 'italic',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  alternateRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  highlightRow: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  moveNumberText: {
    width: 38,
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  moveCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  moveText: {
    color: '#E5E7EB',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  activeMoveText: {
    color: COLORS.primary,
    fontWeight: '700',
  },
});
