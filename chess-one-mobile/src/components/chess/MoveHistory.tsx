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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    overflow: 'hidden',
    height: 120,
    width: '100%',
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
    backgroundColor: '#EEF3E8',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#194E40',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 90,
    width: '100%',
  },
  emptyText: {
    color: '#74817A',
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
    backgroundColor: '#F5F7F2',
  },
  highlightRow: {
    backgroundColor: 'rgba(214, 239, 158, 0.4)',
  },
  moveNumberText: {
    width: 38,
    color: '#74817A',
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  moveCell: {
    flex: 1,
    paddingHorizontal: 6,
  },
  moveText: {
    color: '#202D29',
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  activeMoveText: {
    color: '#194E40',
    fontWeight: '700',
  },
});
