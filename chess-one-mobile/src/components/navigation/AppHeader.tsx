import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/authStore';
import { useRoleStore, roleStore, UserRole, ALLOWED_ROLES } from '../../features/roles/roleStore';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { Feather } from '@expo/vector-icons';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: 'profile' | 'none';
  showLogo?: boolean;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title = 'ChessOne',
  subtitle,
  showBack = false,
  onBack,
  rightAction = 'profile',
  showLogo,
}) => {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const role = useRoleStore();
  const [roleModalVisible, setRoleModalVisible] = useState(false);

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

  const handleSelectRole = (selectedRole: UserRole) => {
    roleStore.setRole(selectedRole);
    setRoleModalVisible(false);
  };

  return (
    <View style={styles.headerContainer}>
      <View style={styles.contentRow}>
        {/* Left: Back button OR Brand Icon */}
        <View style={styles.leftSection}>
          {showLogo || !showBack ? (
            <TouchableOpacity
              style={styles.brandContainer}
              activeOpacity={0.8}
              onPress={() => router.replace('/' as any)}
            >
              <Image 
                source={require('../../../assets/images/chessone-logo.png')} 
                style={{ width: 140, height: 40, resizeMode: 'contain' }}
              />
            </TouchableOpacity>
          ) : (
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
          )}
        </View>

        {/* Right: Authenticated User Chip or Sign In */}
        {rightAction === 'profile' && (
          <View style={styles.rightSection}>
            {/* Interactive Role Switcher Dropdown (Top Right) */}
            <TouchableOpacity
              style={styles.roleChip}
              activeOpacity={0.75}
              onPress={() => setRoleModalVisible(true)}
            >
              <Text style={styles.roleChipText}>{role}</Text>
              <Feather name="chevron-down" size={14} color={COLORS.primary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {isAuthenticated && user ? (
              <TouchableOpacity
                style={styles.userAvatar}
                activeOpacity={0.75}
                onPress={handleProfilePress}
                accessibilityLabel="Open profile"
              >
                <Text style={styles.userInitial}>
                  {(user.name || user.email || 'P')[0].toUpperCase()}
                </Text>
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

      {/* Role Picker Modal: 4 exact options (Student · Coach · School · Organizer) */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <View style={styles.roleMenuCard}>
            <Text style={styles.roleMenuTitle}>Switch View / Role</Text>
            {ALLOWED_ROLES.map((r) => {
              const isCurrent = role === r;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.roleMenuItem, isCurrent && styles.roleMenuItemActive]}
                  onPress={() => handleSelectRole(r)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.roleMenuItemText, isCurrent && styles.roleMenuItemTextActive]}>
                    {r}
                  </Text>
                  {isCurrent && <Feather name="check" size={16} color={COLORS.primary} />}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>
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
    zIndex: 100,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        position: 'sticky' as any,
        top: 0,
        zIndex: 100,
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
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleChip: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: SIZES.radiusChip,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.primary,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 65,
    paddingRight: 20,
  },
  roleMenuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 8,
    width: 170,
    ...SHADOWS.soft,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleMenuTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textBody,
    paddingHorizontal: 10,
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  roleMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  roleMenuItemActive: {
    backgroundColor: COLORS.hero,
  },
  roleMenuItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textHeading,
  },
  roleMenuItemTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
