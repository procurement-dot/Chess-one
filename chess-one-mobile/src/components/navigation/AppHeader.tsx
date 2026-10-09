import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { HOME_THEME } from '../../constants/home-theme';
import { Feather } from '@expo/vector-icons';

const logoImg = require('../../../assets/images/logo-kindersports.png');

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'profile' | 'none';
}

const ROLES = ['Student', 'Parent', 'Coach', 'School', 'Organiser'];

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBack,
  rightAction = 'profile',
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [role, setRole] = useState('Student');

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
    setRole(ROLES[nextIdx]);
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
              <Feather name="chevron-left" size={24} color={HOME_THEME.colors.primary} style={styles.backIcon} />
              <Image source={logoImg} style={styles.logoImg} resizeMode="contain" />
              {title && (
                <View style={styles.backTitleCol}>
                  <Text style={styles.backText}>{title}</Text>
                  {subtitle ? (
                    <Text style={styles.backSubtitle} numberOfLines={1}>{subtitle}</Text>
                  ) : null}
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.brandContainer}
              activeOpacity={0.8}
              onPress={() => router.replace('/' as any)}
            >
              <Image source={logoImg} style={styles.logoImg} resizeMode="contain" />
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
                  <Text style={styles.roleChipText}>{role} ▾</Text>
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
    backgroundColor: HOME_THEME.colors.background,
    height: 56,
    paddingHorizontal: 20,
    justifyContent: 'center',
    zIndex: 50,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
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
  logoImg: {
    width: 120,
    height: 32,
    marginRight: 8,
  },
  backTitleCol: {
    justifyContent: 'center',
  },
  backText: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_THEME.colors.primary,
  },
  backSubtitle: {
    fontSize: 11,
    color: HOME_THEME.colors.mutedText,
    fontWeight: '500',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleChip: {
    backgroundColor: HOME_THEME.colors.roleChipBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
  },
  roleChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: HOME_THEME.colors.roleChipText,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: HOME_THEME.colors.avatarCircle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInitial: {
    fontSize: 16,
    fontWeight: '700',
    color: HOME_THEME.colors.headingText,
  },
  signInBtn: {
    backgroundColor: HOME_THEME.colors.primary,
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
