import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { PieceSymbol, Color } from 'chess.js';

interface ChessPieceProps {
  type: PieceSymbol;
  color: Color;
  size: number;
}

export const ChessPiece: React.FC<ChessPieceProps> = ({ type, color, size }) => {
  const isWhite = color === 'w';
  const fillColor = isWhite ? '#FFFFFF' : '#2B2B2B';
  const strokeColor = isWhite ? '#202020' : '#111111';
  const strokeWidth = 1.5;

  const renderPieceSvg = () => {
    switch (type) {
      case 'p': // Pawn
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <Path
              d="M22.5 9c-2.21 0-4 1.79-4 4 0 .89.29 1.71.78 2.38C17.33 16.5 16 18.59 16 21c0 2.03.94 3.84 2.41 5.03-3 1.06-7.41 5.55-7.41 13.47h23c0-7.92-4.41-12.41-7.41-13.47 1.47-1.19 2.41-3 2.41-5.03 0-2.41-1.33-4.5-3.28-5.62.49-.67.78-1.49.78-2.38 0-2.21-1.79-4-4-4z"
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
            {isWhite && (
              <Path
                d="M19 24.5c.5.5 2 1 3.5 1s3-.5 3.5-1M13 36.5c3-1.5 6-2 9.5-2s6.5.5 9.5 2"
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
              />
            )}
          </Svg>
        );

      case 'n': // Knight
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <G fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M22 10c10.5 1 16.5 8 16 29H15c0-9 10-6.5 8-21" />
              <Path d="M24 18c.38 2.91-5.55 7.37-8 9-3 2-2.82 4.34-5 4-1.042-.94 1.41-3.04 0-3-1 0-.632 1.2-1 2.5-.5 1.5-1.5 2.5-3.5 2.5-1.5 0-2.5-.5-2.5-1.5 0-2 2-3 3-5 1.5-3 2-4 3.5-6.5s3-4 6-5.5c4-2 7.5-2 7.5 3z" />
              <Circle cx="15.5" cy="18.5" r="1.5" fill={isWhite ? '#202020' : '#FFFFFF'} stroke="none" />
            </G>
          </Svg>
        );

      case 'b': // Bishop
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <G fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 36c3.39-.97 10.11.43 13.5-2 3.39 2.43 10.11 1.03 13.5 2 0 0 1.65.54 3 2-.68.97-1.65.99-3 .5-3.39-.97-10.11.46-13.5-1-3.39 1.46-10.11.03-13.5 1-1.354.49-2.323.47-3-.5 1.354-1.94 3-2 3-2zM15 32c2.5 2.5 12.5 2.5 15 0 .5-1.5 0-2 0-2 0-2.5-2.5-4-2.5-4 5.5-1.5 6-11.5-5-15.5-11 4-10.5 14-5 15.5 0 0-2.5 1.5-2.5 4 0 0-.5.5 0 2zM25 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 1 1 5 0z" />
              <Path d="M17.5 26h10M22.5 21v10M20 16l5 5" fill="none" />
            </G>
          </Svg>
        );

      case 'r': // Rook
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <G fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 39h27v-3H9v3zM12 36v-4h21v4H12zM12 32l2-2.5h17l2 2.5H12zM14 29.5v-13h17v13H14zM14 16.5l-2.5-4h22l-2.5 4H14zM11 12.5v-4h4v2h3v-2h4v2h3v-2h4v2h2v-2h4v4H11z" />
              {isWhite && <Path d="M12 32h21M14 29.5h17M14 16.5h17" fill="none" strokeWidth={1} stroke={strokeColor} />}
            </G>
          </Svg>
        );

      case 'q': // Queen
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <G fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 26c8.5-1.5 21-1.5 27 0l2-12-7 11-7-16-7 16-7-11 2 12z" />
              <Path d="M9 26c0 2 1.5 2 2.5 4 1 1.5 1 1 .5 3.5-1.5 1-1.5 2.5-1.5 2.5-1.5 1.5.5 2.5.5 2.5 6.5 1 21 1 27.5 0 0 0 2-1 .5-2.5 0 0 0-1.5-1.5-2.5-.5-2.5-.5-2 .5-3.5 1-2 2.5-2 2.5-4-8.5-1.5-18.5-1.5-27 0z" />
              <Circle cx="6" cy="12" r="2" />
              <Circle cx="14" cy="9" r="2" />
              <Circle cx="22.5" cy="8" r="2" />
              <Circle cx="31" cy="9" r="2" />
              <Circle cx="39" cy="12" r="2" />
            </G>
          </Svg>
        );

      case 'k': // King
        return (
          <Svg viewBox="0 0 45 45" width={size} height={size}>
            <G fill={fillColor} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
              {/* Cross */}
              <Path d="M22.5 11.63V6M20 8h5" fill="none" strokeWidth={strokeWidth + 0.5} />
              {/* Crown and body */}
              <Path d="M22.5 25s4.5-7.5 3-10.5c0 0-1-2.5-3-2.5s-3 2.5-3 2.5c-1.5 3 3 10.5 3 10.5" />
              <Path d="M11.5 37c5.5 3.5 15.5 3.5 21 0v-7s9-4.5 6-10.5c-4-1-8 6-16 1.5-8 4.5-12-2.5-16-1.5-3 6 6 10.5 6 10.5v7.5z" />
              <Path d="M11.5 30c5.5-3 15.5-3 21 0M11.5 33.5c5.5-3 15.5-3 21 0M11.5 37c5.5-3 15.5-3 21 0" fill="none" />
            </G>
          </Svg>
        );

      default:
        return null;
    }
  };

  return (
    <View pointerEvents="none" style={[styles.container, { width: size, height: size }]}>
      {renderPieceSvg()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
