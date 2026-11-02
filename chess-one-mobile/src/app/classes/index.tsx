import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../components/navigation/AppHeader';
import { AppFooter } from '../../components/navigation/AppFooter';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { authStore, useAuthStore } from '../../store/authStore';
import { useClassStore } from '../../store/classStore';
import { useClassRole } from '../../hooks/useClassRole';
import { ClassDTO } from '../../types/class.types';
import {
  ClassCard,
  LoadingState,
  EmptyState,
  ErrorState,
} from '../../components/class';

export default function MyClassesScreen() {
  const router = useRouter();
  const { isAuthenticated, isCoach: authIsCoach } = useAuthStore();
  const { isCoach: hookIsCoach } = useClassRole();
  const isCoach = hookIsCoach || authIsCoach;
  const { myClasses, isLoading, error, fetchMyClasses } = useClassStore();

  const [activeTab, setActiveTab] = useState<'teaching' | 'learning'>(
    isCoach ? 'teaching' : 'learning'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // If role changes, align activeTab appropriately
  useEffect(() => {
    if (!isCoach && activeTab === 'teaching') {
      setActiveTab('learning');
    } else if (isCoach && activeTab === 'learning' && myClasses.some(c => c.myRole === 'OWNER' || c.myRole === 'COACH')) {
      setActiveTab('teaching');
    }
  }, [isCoach, activeTab, myClasses]);

  const loadClasses = useCallback(async () => {
    try {
      await fetchMyClasses();
    } catch {
      // Error handled in store
    }
  }, [fetchMyClasses]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchMyClasses();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter classes based on active tab
  const filteredClasses = myClasses.filter((c) => {
    if (activeTab === 'teaching') {
      return c.myRole === 'OWNER' || c.myRole === 'COACH' || c.myRole === 'ADMIN';
    }
    return c.myRole === 'STUDENT';
  });

  const renderContent = () => {
    if (isLoading && !isRefreshing && myClasses.length === 0) {
      return <LoadingState message="Loading your classes..." />;
    }

    if (error && myClasses.length === 0) {
      return (
        <ErrorState
          error={error}
          onRetry={loadClasses}
          title="Could Not Load Classes"
        />
      );
    }

    if (filteredClasses.length === 0) {
      const emptyMessage =
        activeTab === 'teaching'
          ? 'You have not created any batches yet. Create your first coaching class to begin teaching.'
          : 'You are not enrolled in any class yet. Join with a code from your coach.';

      return (
        <EmptyState
          title={activeTab === 'teaching' ? 'No Teaching Classes' : 'No Enrolled Classes'}
          message={emptyMessage}
          actionLabel={activeTab === 'teaching' ? 'Create a Class' : 'Join a Class'}
          onAction={() =>
            router.push((activeTab === 'teaching' ? '/classes/create' : '/classes/join') as any)
          }
        />
      );
    }

    return (
      <FlatList
        data={filteredClasses}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }: { item: ClassDTO }) => (
          <ClassCard
            item={item}
            onPress={() => router.push(`/classes/${item.id}` as any)}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title="My Classes" subtitle="Interactive batches & coaching" showBack />

      <View style={styles.outerContainer}>
        <View style={styles.innerContainer}>
          {/* Quick Role Switcher for Demo / Presentation */}
          <View style={styles.demoRoleBanner}>
            <Text style={styles.demoRoleBannerText}>
              Mode: <Text style={{ fontWeight: '700' }}>{isCoach ? 'Coach (Coach One)' : 'Student (Player One)'}</Text>
            </Text>
            <TouchableOpacity
              style={styles.demoRoleToggleBtn}
              onPress={() => {
                authStore.loginAsDemoUser(isCoach ? 'PLAYER' : 'COACH');
              }}
              activeOpacity={0.7}
            >
              <Feather name="refresh-cw" size={11} color="#0284C7" style={{ marginRight: 4 }} />
              <Text style={styles.demoRoleToggleText}>
                {isCoach ? 'Switch to Student View' : 'Switch to Coach View'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Header Action Buttons */}
          <View style={styles.topActionsRow}>
            {isCoach && (
              <TouchableOpacity
                style={styles.createBtn}
                onPress={() => router.push('/classes/create' as any)}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={16} color={COLORS.white} />
                <Text style={styles.createBtnText}>Create Class</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.joinBtn, !isCoach && styles.joinBtnFull]}
              onPress={() => router.push('/classes/join' as any)}
              activeOpacity={0.8}
            >
              <Feather name="key" size={16} color={COLORS.primary} />
              <Text style={styles.joinBtnText}>Join with Code</Text>
            </TouchableOpacity>
          </View>

          {/* Role Segment Tabs (Teaching | Learning) */}
          {isCoach && (
            <View style={styles.tabSegmentContainer}>
              <TouchableOpacity
                style={[
                  styles.tabSegment,
                  activeTab === 'teaching' && styles.tabSegmentActive,
                ]}
                onPress={() => setActiveTab('teaching')}
                activeOpacity={0.7}
              >
                <Feather
                  name="award"
                  size={15}
                  color={activeTab === 'teaching' ? COLORS.primary : COLORS.textBody}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    activeTab === 'teaching' && styles.tabSegmentTextActive,
                  ]}
                >
                  Teaching
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabSegment,
                  activeTab === 'learning' && styles.tabSegmentActive,
                ]}
                onPress={() => setActiveTab('learning')}
                activeOpacity={0.7}
              >
                <Feather
                  name="book-open"
                  size={15}
                  color={activeTab === 'learning' ? COLORS.primary : COLORS.textBody}
                />
                <Text
                  style={[
                    styles.tabSegmentText,
                    activeTab === 'learning' && styles.tabSegmentTextActive,
                  ]}
                >
                  Learning
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Main Content Area */}
          <View style={styles.contentArea}>{renderContent()}</View>
        </View>
      </View>

      <AppFooter activeTab="classes" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  outerContainer: {
    flex: 1,
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  topActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  createBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: SIZES.radiusButton || 12,
    ...SHADOWS.soft,
  },
  createBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  joinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderRadius: SIZES.radiusButton || 12,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  joinBtnFull: {
    flex: 1,
  },
  joinBtnText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  tabSegmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabSegmentActive: {
    backgroundColor: COLORS.white,
    ...SHADOWS.soft,
  },
  tabSegmentText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  tabSegmentTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  contentArea: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 24,
  },
  demoRoleBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  demoRoleBannerText: {
    fontSize: 12,
    color: '#0369A1',
  },
  demoRoleToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demoRoleToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
});
