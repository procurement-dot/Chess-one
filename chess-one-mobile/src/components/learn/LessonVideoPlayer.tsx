import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { LevelVideo } from '../../data/learn/levelsData';

interface LessonVideoPlayerProps {
  video: LevelVideo;
}

export const LessonVideoPlayer: React.FC<LessonVideoPlayerProps> = ({ video }) => {
  const [isPlayingNative, setIsPlayingNative] = useState(false);

  return (
    <View style={styles.cardContainer}>
      {/* Top Header Row: Badge & Duration */}
      <View style={styles.headerRow}>
        <View style={styles.badgeBox}>
          <Text style={styles.badgeText}>
            🎬 {video.badge || 'LESSON VIDEO'}
          </Text>
        </View>
        {video.duration ? (
          <View style={styles.durationPill}>
            <Feather name="clock" size={12} color={COLORS.primary} style={{ marginRight: 4 }} />
            <Text style={styles.durationText}>{video.duration}</Text>
          </View>
        ) : null}
      </View>

      {/* Video Title */}
      {video.title ? (
        <Text style={styles.videoTitle}>{video.title}</Text>
      ) : null}

      {/* Video Viewport */}
      <View style={styles.playerWrapper}>
        {Platform.OS === 'web' ? (
          // Web: Native HTML5 Responsive Video Element
          React.createElement('video', {
            src: video.videoUrl,
            poster: video.thumbnailUrl,
            controls: true,
            playsInline: true,
            preload: 'metadata',
            style: {
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: 12,
              backgroundColor: '#0F172A',
              display: 'block',
              outline: 'none',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
            },
          })
        ) : (
          // Mobile Native (iOS / Android) Fallback with poster & play overlay
          <View style={styles.nativeVideoBox}>
            {video.thumbnailUrl ? (
              <Image
                source={{ uri: video.thumbnailUrl }}
                style={styles.nativePoster}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.nativePoster, { backgroundColor: '#1E293B' }]} />
            )}
            <View style={styles.nativeOverlay}>
              <TouchableOpacity
                style={styles.nativePlayBtn}
                activeOpacity={0.8}
                onPress={() => setIsPlayingNative(true)}
              >
                <Feather name="play" size={28} color={COLORS.white} style={{ marginLeft: 3 }} />
              </TouchableOpacity>
              <Text style={styles.nativePlayLabel}>
                {isPlayingNative ? 'Playing Lesson...' : 'Tap to Play Lesson'}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Child Guidance Note */}
      <View style={styles.guidanceBox}>
        <Text style={styles.guidanceText}>
          💡 <Text style={{ fontWeight: '700', color: COLORS.primary }}>Coach One Tip:</Text> Watch this short animated lesson carefully, then solve the quiz question below to earn your stars!
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#D5E8CA',
    ...SHADOWS.soft,
    marginBottom: 16,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeBox: {
    backgroundColor: '#EBF3E7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  videoTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textHeading,
    lineHeight: 20,
  },
  playerWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#0F172A',
  },
  nativeVideoBox: {
    width: '100%',
    aspectRatio: 16 / 9,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  nativePoster: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
  nativeOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nativePlayBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
    marginBottom: 6,
  },
  nativePlayLabel: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  guidanceBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 2,
  },
  guidanceText: {
    fontSize: 12,
    color: COLORS.textBody,
    lineHeight: 17,
  },
});
