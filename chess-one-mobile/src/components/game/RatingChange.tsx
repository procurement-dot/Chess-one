import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SIZES } from '../../constants/chessone-theme';

export interface RatingChangeProps {
  change: number | null | undefined;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export const RatingChange: React.FC<RatingChangeProps> = ({ change, style, textStyle }) => {
  if (change === null || change === undefined) {
    return null;
  }

  let formattedText = '±0';
  let textColor = COLORS.textBody;
  let bgColor = COLORS.border;

  if (change > 0) {
    formattedText = `+${change}`;
    textColor = '#3B6D11';
    bgColor = '#EAF3DE';
  } else if (change < 0) {
    formattedText = `\u2212${Math.abs(change)}`;
    textColor = '#A32D2D';
    bgColor = '#FCEBEB';
  }

  return (
    <View style={[styles.badge, { backgroundColor: bgColor }, style]}>
      <Text style={[styles.text, { color: textColor }, textStyle]}>
        {formattedText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: SIZES.radiusChip,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
