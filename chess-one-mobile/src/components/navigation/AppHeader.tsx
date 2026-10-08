import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';

const logoBanner = require('../../../assets/images/chessone-logo-transparent.png');
const logoIcon = require('../../../assets/images/chessone-icon.png');

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
              <Image
                source={logoIcon}
                style={styles.backLogoIcon}
                resizeMode="contain"
              />
              <View style={styles.backTitleCol}>
                <Text style={styles.backText}>
                  {title !== 'ChessOne' ? title : 'Back'}
                </Text>
                {subtitle ? (
                  <Text style={styles.backSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.brandContainer}
              activeOpacity={0.8}
              onPress={() => router.replace('/' as any)}
            >
              {title === 'ChessOne' ? (
                <Image
                  source={logoBanner}
                  style={styles.brandLogoImage}
                  resizeMode="contain"
                />
              ) : (
                <>
                  <Image
                    source={logoIcon}
                    style={styles.brandIconSquare}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.brandTitle}>{title}</Text>
                    {subtitle ? (
                      <Text style={styles.brandSubtitle}>{subtitle}</Text>
                    ) : (
                      <Text style={styles.brandSubtitle}>Live Match Arena</Text>
                    )}
                  </View>
                </>
              )}
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
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#202D29',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
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
    color: '#194E40',
    lineHeight: 26,
    marginRight: 4,
  },
  backLogoIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    marginRight: 8,
  },
  backTitleCol: {
    justifyContent: 'center',
  },
  backText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#194E40',
  },
  backSubtitle: {
    fontSize: 11,
    color: '#74817A',
    fontWeight: '500',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandLogoImage: {
    width: 118,
    height: 42,
  },
  brandIconSquare: {
    width: 34,
    height: 34,
    borderRadius: 9,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#202D29',
    letterSpacing: 0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    color: '#74817A',
    fontWeight: '500',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF3E8',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    gap: 8,
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#194E40',
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
    backgroundColor: '#4F8A5B',
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#202D29',
    maxWidth: 90,
  },
  idBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#D5DFC8',
  },
  idBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#194E40',
  },
  signInBtn: {
    backgroundColor: '#194E40',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
