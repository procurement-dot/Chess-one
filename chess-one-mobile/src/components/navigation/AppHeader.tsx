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
import { useRoleStore, roleStore, UserRole } from '../../features/roles/roleStore';
import { COLORS, SIZES, FONTS } from '../../constants/chessone-theme';
import { Feather } from '@expo/vector-icons';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'profile' | 'none';
}

const ROLES: UserRole[] = ['Student', 'Parent', 'Coach', 'School', 'Organiser'];

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'ChessOne',
  subtitle,
  showBack = false,
  onBack,
  rightAction = 'profile',
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const role = useRoleStore();

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

  const cycleRole = () => {
    const nextIdx = (ROLES.indexOf(role) + 1) % ROLES.length;
    roleStore.setRole(ROLES[nextIdx]);
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
              <Feather name="chevron-left" size={24} color={COLORS.primary} style={styles.backIcon} />
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
              <Image 
                source={require('../../assets/images/chessone-logo.png')} 
                style={{ width: 140, height: 40, resizeMode: 'contain' }}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* Right: Authenticated User Chip or Sign In */}
        {rightAction === 'profile' && (
          <View style={styles.rightSection}>
            {isAuthenticated && user ? (
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.roleChip}
                  activeOpacity={0.7}
                  onPress={cycleRole}
                >
                  <Text style={styles.roleChipText}>{role}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.userAvatar}
                  activeOpacity={0.75}
                  onPress={handleProfilePress}
                >
                  <Text style={styles.userInitial}>
                    {(user.name || user.email || 'P')[0].toUpperCase()}
                  </Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
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
    marginRight: 4,
  },
  backTitleCol: {
    justifyContent: 'center',
  },
  backText: {
    fontSize: SIZES.fontBody,
    fontWeight: FONTS.headingWeight,
    color: COLORS.primary,
  },
  backSubtitle: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '500',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoSquare: {
    width: 30,
    height: 30,
    borderRadius: SIZES.radiusChip,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  logoKnight: {
    fontSize: 18,
    color: COLORS.white,
    lineHeight: 22,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: FONTS.headingWeight,
    color: COLORS.textHeading,
    letterSpacing: 0.3,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roleChip: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: SIZES.radiusChip,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accentPeach,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.white,
  },
  signInBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: SIZES.radiusButton,
  },
  signInBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
