import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
} from 'react-native';

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');

interface MatchStartVsModalProps {
  visible: boolean;
  gameId: number | string;
  whitePlayerName?: string;
  blackPlayerName?: string;
  whitePlayerAvatar?: string | null;
  blackPlayerAvatar?: string | null;
  timeControl?: string;
  durationMs?: number;
  onComplete: () => void;
}

export const MatchStartVsModal: React.FC<MatchStartVsModalProps> = ({
  visible,
  gameId,
  whitePlayerName = 'White Player',
  blackPlayerName = 'Black Player',
  whitePlayerAvatar,
  blackPlayerAvatar,
  timeControl = '5+0',
  durationMs = 2000,
  onComplete,
}) => {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const leftSlideAnim = useRef(new Animated.Value(-80)).current;
  const rightSlideAnim = useRef(new Animated.Value(80)).current;
  const vsScaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!visible) {
      fadeAnim.setValue(0);
      leftSlideAnim.setValue(-80);
      rightSlideAnim.setValue(80);
      vsScaleAnim.setValue(0);
      return;
    }

    // 1. Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.spring(leftSlideAnim, {
        toValue: 0,
        tension: 70,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(rightSlideAnim, {
        toValue: 0,
        tension: 70,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.spring(vsScaleAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 2. Pulse loop on VS badge
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 3. Exactly 2 seconds timer (durationMs = 2000)
    const timer = setTimeout(() => {
      pulseLoop.stop();
      onComplete();
    }, durationMs);

    return () => {
      pulseLoop.stop();
      clearTimeout(timer);
    };
  }, [visible, durationMs, onComplete]);

  if (!visible) return null;

  const whiteInitial = (whitePlayerName || 'W').charAt(0).toUpperCase();
  const blackInitial = (blackPlayerName || 'B').charAt(0).toUpperCase();

  return (
    <Modal transparent animationType="none" visible={visible}>
      <View style={styles.overlay}>
        <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
          {/* Header Bar */}
          <View style={styles.topHeader}>
            <Image
              source={logoBanner}
              style={styles.vsBrandLogo}
              resizeMode="contain"
            />
            <View style={styles.topHeaderRight}>
              <Text style={styles.headerBadge}>⚡ MATCH READY</Text>
              <Text style={styles.headerSub}>⏱️ {timeControl} Live Chess</Text>
            </View>
          </View>

          {/* Horizontal Face-Off Arena */}
          <View style={styles.horizontalArena}>
            {/* White Player (Left) */}
            <Animated.View
              style={[
                styles.playerBox,
                styles.whiteBox,
                { transform: [{ translateX: leftSlideAnim }] },
              ]}
            >
              <View style={styles.avatarWhite}>
                {whitePlayerAvatar ? (
                  <Image source={{ uri: whitePlayerAvatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarLetterWhite}>{whiteInitial}</Text>
                )}
              </View>
              <View style={styles.playerInfoLeft}>
                <View style={styles.colorPillWhite}>
                  <Text style={styles.colorPillTextWhite}>WHITE ♔</Text>
                </View>
                <Text style={styles.playerName} numberOfLines={1}>
                  {whitePlayerName}
                </Text>
              </View>
            </Animated.View>

            {/* Glowing VS Badge (Center) */}
            <Animated.View
              style={[
                styles.vsContainer,
                {
                  transform: [
                    { scale: Animated.multiply(vsScaleAnim, pulseAnim) },
                  ],
                },
              ]}
            >
              <View style={styles.vsCircle}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            </Animated.View>

            {/* Black Player (Right) */}
            <Animated.View
              style={[
                styles.playerBox,
                styles.blackBox,
                { transform: [{ translateX: rightSlideAnim }] },
              ]}
            >
              <View style={styles.playerInfoRight}>
                <View style={styles.colorPillBlack}>
                  <Text style={styles.colorPillTextBlack}>BLACK ♚</Text>
                </View>
                <Text style={styles.playerNameRight} numberOfLines={1}>
                  {blackPlayerName}
                </Text>
              </View>
              <View style={styles.avatarBlack}>
                {blackPlayerAvatar ? (
                  <Image source={{ uri: blackPlayerAvatar }} style={styles.avatarImg} />
                ) : (
                  <Text style={styles.avatarLetterBlack}>{blackInitial}</Text>
                )}
              </View>
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(32, 45, 41, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#D5DFC8',
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
    marginBottom: 14,
  },
  vsBrandLogo: {
    width: 95,
    height: 34,
  },
  topHeaderRight: {
    alignItems: 'flex-end',
  },
  headerBadge: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.5,
    color: '#194E40',
    textTransform: 'uppercase',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '600',
    color: '#74817A',
  },
  horizontalArena: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playerBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 10,
  },
  whiteBox: {
    backgroundColor: '#EEF3E8',
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  blackBox: {
    backgroundColor: '#202D29',
    borderWidth: 1,
    borderColor: '#2E3F3A',
    justifyContent: 'flex-end',
  },
  avatarWhite: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#D5DFC8',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLetterWhite: {
    fontSize: 20,
    fontWeight: '800',
    color: '#194E40',
  },
  avatarBlack: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#172421',
    borderWidth: 2,
    borderColor: '#374B45',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarLetterBlack: {
    fontSize: 20,
    fontWeight: '800',
    color: '#D6EF9E',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  playerInfoLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  playerInfoRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  colorPillWhite: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  colorPillTextWhite: {
    color: '#194E40',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  colorPillBlack: {
    backgroundColor: '#172421',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#374B45',
  },
  colorPillTextBlack: {
    color: '#D6EF9E',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  playerName: {
    color: '#202D29',
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 120,
  },
  playerNameRight: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
    maxWidth: 120,
  },
  vsContainer: {
    marginHorizontal: 8,
    zIndex: 10,
  },
  vsCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#194E40',
    borderWidth: 2.5,
    borderColor: '#D6EF9E',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  vsText: {
    color: '#D6EF9E',
    fontSize: 16,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
});
