import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SHADOWS } from '../../constants/chessone-theme';

interface CoachSpeechBubbleProps {
  feedback: string;
  status: 'idle' | 'wrong' | 'success';
  isSpeaking?: boolean;
  onReplayVoice?: () => void;
}

const COACH_ASSETS = {
  idle: require('../../../assets/images/coach/coach_idle.jpg'),
  wrong: require('../../../assets/images/coach/coach_encourage.jpg'),
  success: require('../../../assets/images/coach/coach_celebrate.jpg'),
};

export const CoachSpeechBubble: React.FC<CoachSpeechBubbleProps> = ({
  feedback,
  status,
  isSpeaking,
  onReplayVoice,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const bubbleFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Subtle bounce and pulse whenever status or dialogue updates
    scaleAnim.setValue(0.92);
    bubbleFadeAnim.setValue(0.7);

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 100,
        useNativeDriver: true,
      }),
      Animated.timing(bubbleFadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [status, feedback]);

  const avatarSource = COACH_ASSETS[status] || COACH_ASSETS.idle;

  const headerTitle =
    status === 'wrong'
      ? 'Coach One • Guiding Advice'
      : status === 'success'
      ? 'Coach One • Brilliant Move! 🏆'
      : 'Coach One • Tactical Radar';

  const badgeIcon = status === 'wrong' ? '👆' : status === 'success' ? '🎉' : '💡';

  return (
    <View style={styles.container}>
      {/* Animated Mascot Avatar */}
      <TouchableOpacity
        style={styles.avatarWrapper}
        onPress={onReplayVoice}
        activeOpacity={0.8}
        disabled={!onReplayVoice}
      >
        <Animated.View
          style={[
            styles.avatarGlow,
            status === 'wrong' && styles.avatarGlowWrong,
            status === 'success' && styles.avatarGlowSuccess,
            isSpeaking && styles.avatarGlowSpeaking,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
          <View
            style={[
              styles.avatarBadge,
              status === 'wrong' && styles.avatarBadgeWrong,
              status === 'success' && styles.avatarBadgeSuccess,
              isSpeaking && styles.avatarBadgeSpeaking,
            ]}
          >
            <Text style={styles.badgeEmoji}>{isSpeaking ? '🗣️' : badgeIcon}</Text>
          </View>
        </Animated.View>
        <Text style={styles.coachNameText}>Coach One</Text>
      </TouchableOpacity>

      {/* Comic Speech Bubble */}
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onReplayVoice}
        disabled={!onReplayVoice}
        style={{ flex: 1 }}
      >
        <Animated.View
          style={[
            styles.speechBubble,
            status === 'wrong' && styles.speechBubbleWrong,
            status === 'success' && styles.speechBubbleSuccess,
            isSpeaking && styles.speechBubbleSpeaking,
            { opacity: bubbleFadeAnim },
          ]}
        >
          {/* Comic Pointer / Tail */}
          <View
            style={[
              styles.bubbleTail,
              status === 'wrong' && styles.bubbleTailWrong,
              status === 'success' && styles.bubbleTailSuccess,
            ]}
          />
          <View
            style={[
              styles.bubbleTailInner,
              status === 'wrong' && styles.bubbleTailInnerWrong,
              status === 'success' && styles.bubbleTailInnerSuccess,
            ]}
          />

          <View style={styles.bubbleContent}>
            <View style={styles.bubbleHeaderRow}>
              <Text
                style={[
                  styles.bubbleTitle,
                  status === 'wrong' && styles.bubbleTitleWrong,
                  status === 'success' && styles.bubbleTitleSuccess,
                ]}
              >
                {headerTitle}
              </Text>
              {onReplayVoice && (
                <View
                  style={[
                    styles.listenBadge,
                    isSpeaking && styles.listenBadgeSpeaking,
                    status === 'wrong' && styles.listenBadgeWrong,
                    status === 'success' && styles.listenBadgeSuccess,
                  ]}
                >
                  <Feather
                    name={isSpeaking ? 'volume-2' : 'volume-1'}
                    size={11}
                    color={
                      isSpeaking
                        ? '#2563EB'
                        : status === 'wrong'
                        ? '#DC2626'
                        : status === 'success'
                        ? '#059669'
                        : '#B45309'
                    }
                  />
                  <Text
                    style={[
                      styles.listenBadgeText,
                      isSpeaking && styles.listenBadgeTextSpeaking,
                      status === 'wrong' && { color: '#DC2626' },
                      status === 'success' && { color: '#059669' },
                    ]}
                  >
                    {isSpeaking ? 'Speaking...' : 'Listen'}
                  </Text>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.bubbleText,
                status === 'wrong' && styles.bubbleTextWrong,
                status === 'success' && styles.bubbleTextSuccess,
              ]}
            >
              &ldquo;{feedback}&rdquo;
            </Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
    width: '100%',
  },
  avatarWrapper: {
    alignItems: 'center',
    gap: 4,
  },
  avatarGlow: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2.5,
    borderColor: '#D97706',
    backgroundColor: '#FAF7F0',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.soft,
  },
  avatarGlowWrong: {
    borderColor: '#EF4444',
  },
  avatarGlowSuccess: {
    borderColor: '#10B981',
  },
  avatarGlowSpeaking: {
    borderColor: '#3B82F6',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FEF3C7',
    borderWidth: 1.5,
    borderColor: '#D97706',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBadgeWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#EF4444',
  },
  avatarBadgeSuccess: {
    backgroundColor: '#D1FAE5',
    borderColor: '#10B981',
  },
  avatarBadgeSpeaking: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
  },
  badgeEmoji: {
    fontSize: 11,
  },
  coachNameText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.3,
  },
  speechBubble: {
    flex: 1,
    backgroundColor: '#FFFDF7',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    position: 'relative',
    ...SHADOWS.soft,
  },
  speechBubbleWrong: {
    backgroundColor: '#FFF8F6',
    borderColor: '#FCA5A5',
  },
  speechBubbleSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#86EFAC',
  },
  speechBubbleSpeaking: {
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
  },
  bubbleTail: {
    position: 'absolute',
    left: -8,
    top: 22,
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderRightWidth: 8,
    borderBottomWidth: 7,
    borderTopColor: 'transparent',
    borderRightColor: '#FDE68A',
    borderBottomColor: 'transparent',
  },
  bubbleTailWrong: {
    borderRightColor: '#FCA5A5',
  },
  bubbleTailSuccess: {
    borderRightColor: '#86EFAC',
  },
  bubbleTailInner: {
    position: 'absolute',
    left: -6,
    top: 22,
    width: 0,
    height: 0,
    borderTopWidth: 6,
    borderRightWidth: 7,
    borderBottomWidth: 6,
    borderTopColor: 'transparent',
    borderRightColor: '#FFFDF7',
    borderBottomColor: 'transparent',
  },
  bubbleTailInnerWrong: {
    borderRightColor: '#FFF8F6',
  },
  bubbleTailInnerSuccess: {
    borderRightColor: '#F0FDF4',
  },
  bubbleContent: {
    gap: 3,
  },
  bubbleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bubbleTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  bubbleTitleWrong: {
    color: '#DC2626',
  },
  bubbleTitleSuccess: {
    color: '#059669',
  },
  listenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginLeft: 'auto',
  },
  listenBadgeSpeaking: {
    backgroundColor: '#EFF6FF',
    borderColor: '#BFDBFE',
  },
  listenBadgeWrong: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
  },
  listenBadgeSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  listenBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  listenBadgeTextSpeaking: {
    color: '#2563EB',
  },
  bubbleText: {
    fontSize: 12.5,
    color: '#374151',
    lineHeight: 18,
    fontWeight: '600',
  },
  bubbleTextWrong: {
    color: '#991B1B',
  },
  bubbleTextSuccess: {
    color: '#065F46',
    fontWeight: '700',
  },
});
