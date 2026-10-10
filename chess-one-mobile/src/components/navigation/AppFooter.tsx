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
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/chessone-theme';

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
    icon: keyof typeof Feather.glyphMap;
    route: string;
    badgeCount?: number;
  }[] = [
    {
      id: 'home',
      highlightIds: ['home'],
      label: 'Home',
      icon: 'home',
      route: '/',
      badgeCount: pendingCount,
    },
    {
      id: 'learn',
      highlightIds: ['learn'],
      label: 'Learn',
      icon: 'book-open',
      route: '/learn',
    },
    {
      id: 'play',
      highlightIds: ['play', 'create', 'join'],
      label: 'Play',
      icon: 'play-circle',
      route: '/play',
    },
    {
      id: 'tournaments',
      highlightIds: ['tournaments'],
      label: 'Tournaments',
      icon: 'award',
      route: '/tournaments',
    },
    {
      id: 'community',
      highlightIds: ['community'],
      label: 'Community',
      icon: 'users',
      route: '/community',
    },
    {
      id: 'classes',
      highlightIds: ['classes'],
      label: 'Classes',
      icon: 'video',
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
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.route)}
            >
              <View style={styles.iconWrapper}>
                <Feather 
                  name={tab.icon} 
                  size={22} 
                  color={isActive ? COLORS.primary : COLORS.textBody} 
                />
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
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingBottom: Platform.OS === 'web' ? 18 : (Platform.OS === 'ios' ? 24 : 10),
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 10,
      },
      web: {
        position: 'sticky' as any,
        bottom: 0,
        zIndex: 2147483647,
        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
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
    minHeight: 50,
    borderRadius: 12,
    position: 'relative',
    cursor: 'pointer' as any,
    touchAction: 'manipulation' as any,
  },
  activeTabButton: {
    backgroundColor: COLORS.hero,
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textBody,
    marginTop: 4,
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  badgePill: {
    position: 'absolute',
    top: -6,
    right: -10,
    backgroundColor: COLORS.accentPeach,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: '800',
  },
});
