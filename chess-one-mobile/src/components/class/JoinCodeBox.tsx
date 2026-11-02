import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';

interface JoinCodeBoxProps {
  joinCode: string;
  className?: string;
}

export const JoinCodeBox: React.FC<JoinCodeBoxProps> = ({ joinCode, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(joinCode);
      } else {
        // Dynamic import / fallback
        try {
          const Clipboard = require('expo-clipboard');
          if (Clipboard.setStringAsync) {
            await Clipboard.setStringAsync(joinCode);
          }
        } catch {
          // Fallback alert
        }
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert('Join Code', joinCode);
    }
  };

  const handleShare = async () => {
    const shareMessage = `Join my chess class${
      className ? ` "${className}"` : ''
    } on ChessOne using code: ${joinCode}`;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'ChessOne Class Code',
          text: shareMessage,
        });
        return;
      } catch {
        // User cancelled or unsupported
      }
    }

    try {
      const Sharing = require('expo-sharing');
      if (Sharing.shareAsync) {
        // Native sharing
        await handleCopy();
        Alert.alert('Code Copied', 'Class join code copied to clipboard!');
        return;
      }
    } catch {
      // Fallback
    }

    await handleCopy();
    Alert.alert('Code Copied', 'Class join code copied to clipboard!');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>CLASS JOIN CODE</Text>

      <View style={styles.codeRow}>
        <View style={styles.codeBox}>
          <Text style={styles.codeText}>{joinCode}</Text>
        </View>

        <TouchableOpacity
          style={[styles.actionBtn, copied && styles.actionBtnActive]}
          onPress={handleCopy}
          activeOpacity={0.7}
          accessibilityLabel="Copy join code"
        >
          <Feather
            name={copied ? 'check' : 'copy'}
            size={18}
            color={copied ? '#166534' : COLORS.primary}
          />
          <Text style={[styles.actionBtnText, copied && styles.actionBtnTextActive]}>
            {copied ? 'Copied' : 'Copy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.shareBtn}
          onPress={handleShare}
          activeOpacity={0.7}
          accessibilityLabel="Share join code"
        >
          <Feather name="share-2" size={18} color={COLORS.white} />
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        Share this 6-character code with your students to invite them to this class.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAF5',
    borderRadius: SIZES.radiusCard || 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: COLORS.primary,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  codeBox: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    minWidth: 130,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    letterSpacing: 4,
    color: COLORS.textHeading,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: '#166534',
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  actionBtnTextActive: {
    color: '#166534',
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  shareBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textBody,
    marginTop: 4,
    lineHeight: 16,
  },
});
