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

export type FooterTab = 'home' | 'create' | 'community' | 'history' | 'account' | 'join';

interface AppFooterProps {
  activeTab?: FooterTab;
}

export const AppFooter: React.FC<AppFooterProps> = ({ activeTab = 'home' }) => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { pendingCount } = useInvitations(isAuthenticated);

  const tabs: {
    id: FooterTab;
    label: string;
    icon: string;
    route: string;
    badgeCount?: number;
  }[] = [
    {
      id: 'home',
      label: 'Home',
      icon: '♟️',
      route: '/',
      badgeCount: pendingCount,
    },
    {
      id: 'create',
      label: 'Create',
      icon: '⚔️',
      route: '/play/create',
    },
    {
      id: 'community',
      label: 'Community',
      icon: '👥',
      route: '/community',
    },
    {
      id: 'account',
      label: 'Account',
      icon: '👤',
      route: '/login',
    },
  ];

  const handleTabPress = (route: string) => {
    router.push(route as any);
  };

  return (
    <View style={styles.footerContainer}>
      <View style={styles.innerFooter}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.activeTabButton]}
              activeOpacity={0.7}
              onPress={() => handleTabPress(tab.route)}
            >
              <View style={styles.iconWrapper}>
                <Text style={[styles.tabIcon, isActive && styles.activeTabIcon]}>
                  {tab.icon}
                </Text>
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

              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: {
    backgroundColor: '#12161C',
    borderTopWidth: 1,
    borderTopColor: '#1F2633',
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
      android: {
        elevation: 8,
      },
      web: {
        position: 'sticky' as any,
        bottom: 0,
        zIndex: 50,
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
    paddingVertical: 4,
    borderRadius: 12,
    position: 'relative',
  },
  activeTabButton: {
    backgroundColor: '#161D2A',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.7,
  },
  activeTabIcon: {
    opacity: 1,
    transform: [{ scale: 1.1 }],
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
  },
  activeTabLabel: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -6,
    width: 18,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#38BDF8',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#EF4444',
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
