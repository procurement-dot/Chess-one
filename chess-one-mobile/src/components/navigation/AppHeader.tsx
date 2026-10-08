import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'profile' | 'none';
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'ChessOne',
  subtitle,
  showBack = false,
  onBack,
  rightAction = 'profile',
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/play' as any);
    }
  };

  const handleProfilePress = () => {
    router.push('/login' as any);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.contentRow}>
        {/* Left: Back button OR Brand Icon */}
        <View style={styles.leftSection}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              activeOpacity={0.7}
              onPress={handleBack}
            >
              <Text style={styles.backIcon}>‹</Text>
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.brandContainer}
              activeOpacity={0.8}
              onPress={() => router.replace('/' as any)}
            >
              <View style={styles.brandIconBox}>
                <Text style={styles.brandIcon}>♟️</Text>
              </View>
              <View>
                <Text style={styles.brandTitle}>{title}</Text>
                {subtitle ? (
                  <Text style={styles.brandSubtitle}>{subtitle}</Text>
                ) : (
                  <Text style={styles.brandSubtitle}>Live Match Arena</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        </View>

        {/* Right: Authenticated User Chip or Sign In */}
        {rightAction === 'profile' && (
          <View style={styles.rightSection}>
            {isAuthenticated && user ? (
              <TouchableOpacity
                style={styles.userChip}
                activeOpacity={0.75}
                onPress={handleProfilePress}
              >
                <View style={styles.userAvatar}>
                  <Text style={styles.userInitial}>
                    {(user.name || user.email || 'P')[0].toUpperCase()}
                  </Text>
                  <View style={styles.onlineDot} />
                </View>
                <View style={styles.userMeta}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user.name || 'Player'}
                  </Text>
                  <View style={styles.idBadge}>
                    <Text style={styles.idBadgeText}>ID: #{user.id}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.signInBtn}
                activeOpacity={0.8}
                onPress={handleProfilePress}
              >
                <Text style={styles.signInBtnText}>Sign In</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#12161C',
    borderBottomWidth: 1,
    borderBottomColor: '#1F2633',
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 50,
      },
    }),
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 46,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingRight: 12,
  },
  backIcon: {
    fontSize: 26,
    color: '#38BDF8',
    lineHeight: 26,
    marginRight: 4,
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#38BDF8',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#38BDF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandIcon: {
    fontSize: 20,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A212D',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#2D3748',
    gap: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  userInitial: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 1,
    borderColor: '#12161C',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    maxWidth: 90,
  },
  idBadge: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#334155',
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#60A5FA',
  },
  signInBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 10,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
