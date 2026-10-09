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
import { useInvitations } from '../../hooks/useInvitations';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { HOME_THEME } from '../../constants/home-theme';

export type FooterTab = 'home' | 'create' | 'community' | 'history' | 'account' | 'join' | 'learn' | 'tournaments' | 'classes' | 'play';

interface AppFooterProps {
  activeTab?: FooterTab;
}

export const AppFooter: React.FC<AppFooterProps> = ({ activeTab = 'home' }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { pendingCount } = useInvitations(isAuthenticated);

  const tabs: {
    id: FooterTab;
    highlightIds: FooterTab[];
    label: string;
    family: 'Ionicons' | 'MaterialCommunityIcons';
    icon: any;
    route: string;
    badgeCount?: number;
  }[] = [
    {
      id: 'home',
      highlightIds: ['home'],
      label: 'Home',
      family: 'Ionicons',
      icon: 'home-outline',
      route: '/',
      badgeCount: pendingCount,
    },
    {
      id: 'learn',
      highlightIds: ['learn'],
      label: 'Learn',
      family: 'MaterialCommunityIcons',
      icon: 'view-grid-outline',
      route: '/learn',
    },
    {
      id: 'play',
      highlightIds: ['play', 'create', 'join'],
      label: 'Play',
      family: 'MaterialCommunityIcons',
      icon: 'chess-knight',
      route: '/play',
    },
    {
      id: 'tournaments',
      highlightIds: ['tournaments'],
      label: 'Tournaments',
      family: 'MaterialCommunityIcons',
      icon: 'chess-rook',
      route: '/tournaments',
    },
    {
      id: 'community',
      highlightIds: ['community'],
      label: 'Community',
      family: 'Ionicons',
      icon: 'happy-outline',
      route: '/community',
    },
    {
      id: 'classes',
      highlightIds: ['classes'],
      label: 'Classes',
      family: 'MaterialCommunityIcons',
      icon: 'view-list-outline',
      route: '/classes',
    },
  ];

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.innerFooter}>
        {tabs.map((tab) => {
          const isActive = tab.highlightIds.includes(activeTab);
          const iconColor = isActive ? HOME_THEME.colors.primary : HOME_THEME.colors.mutedText;

          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.route)}
            >
              <View style={styles.iconWrapper}>
                {tab.family === 'Ionicons' ? (
                  <Ionicons name={tab.icon} size={20} color={iconColor} />
                ) : (
                  <MaterialCommunityIcons name={tab.icon} size={20} color={iconColor} />
                )}
                
                {Boolean(tab.badgeCount && tab.badgeCount > 0) && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>
                      {tab.badgeCount! > 9 ? '9+' : tab.badgeCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: HOME_THEME.colors.footerBackground,
    borderTopWidth: 0,
    paddingBottom: Platform.OS === 'web' ? 10 : (Platform.OS === 'ios' ? 24 : 10),
    paddingTop: 8,
    paddingHorizontal: 8,
    height: Platform.OS === 'web' ? 68 : (Platform.OS === 'ios' ? 92 : 68),
    ...Platform.select({
      web: {
        position: 'sticky' as any,
        bottom: 0,
        zIndex: 2147483647,
      },
    }),
  },
  innerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    maxWidth: 700,
    marginHorizontal: 'auto' as any,
    width: '100%',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  activeTabButton: {
    backgroundColor: HOME_THEME.colors.activeTabPill,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10.5,
    fontWeight: '500',
    color: HOME_THEME.colors.mutedText,
    marginTop: 2,
  },
  activeTabLabel: {
    color: HOME_THEME.colors.primary,
    fontWeight: '700',
  },
  badgePill: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: '#FBA586',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
