import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { COLORS } from '../../constants/chessone-theme';

interface CustomWheelPickerProps {
  items: { label: string; value: string | number }[];
  selectedValue: string | number;
  onValueChange: (value: string | number) => void;
  itemHeight?: number;
  suffix?: string;
}

export const CustomWheelPicker: React.FC<CustomWheelPickerProps> = ({
  items,
  selectedValue,
  onValueChange,
  itemHeight = 50,
  suffix = '',
}) => {
  const scrollViewRef = useRef<ScrollView>(null);
  const activeIndex = Math.max(0, items.findIndex((i) => i.value === selectedValue));

  useEffect(() => {
    // Initial scroll position
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ y: activeIndex * itemHeight, animated: false });
    }
  }, []); // Only run once on mount

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    const index = Math.round(y / itemHeight);
    
    // Ensure index is valid and value has changed before firing update
    if (index >= 0 && index < items.length) {
      if (items[index].value !== selectedValue) {
        onValueChange(items[index].value);
      }
    }
  };

  return (
    <View style={{ height: itemHeight * 3, flex: 1 }}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={itemHeight}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16} // smooth updates
        contentContainerStyle={{ paddingVertical: itemHeight }}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          return (
            <View key={item.value} style={{ height: itemHeight, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{
                fontSize: isActive ? 28 : 20,
                fontWeight: isActive ? '800' : '600',
                color: isActive ? COLORS.textHeading : COLORS.textBody,
                opacity: isActive ? 1 : 0.3
              }}>
                {item.label}
              </Text>
              {suffix ? (
                <Text style={{
                  fontSize: 14,
                  fontWeight: '600',
                  color: isActive ? COLORS.textBody : COLORS.textBody,
                  opacity: isActive ? 1 : 0.3,
                  marginLeft: 4,
                  marginTop: isActive ? 8 : 4,
                }}>
                  {suffix}
                </Text>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      
      {/* Center Highlight Overlay */}
      <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none', justifyContent: 'center' }]}>
        <View style={{ height: itemHeight, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }} />
      </View>
    </View>
  );
};
