import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { COLORS, SIZES, SHADOWS } from '../../../constants/chessone-theme';
import { classService } from '../../../services/class.service';
import { useClassStore } from '../../../store/classStore';
import { useClassRole } from '../../../hooks/useClassRole';
import { ClassDTO } from '../../../types/class.types';
import {
  LoadingState,
  ErrorState,
  JoinCodeBox,
  ClassTabs,
  ClassTabKey,
} from '../../../components/class';
import { getErrorMessage } from '../../../utils/classErrors';

export default function ClassHomeScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const parsedId = parseInt(classId || '0', 10);

  const { upsertClass } = useClassStore();
  const { isCoach, isOwner } = useClassRole(parsedId);

  const [classData, setClassData] = useState<ClassDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<ClassTabKey>('overview');

  const loadClass = useCallback(async () => {
    if (!parsedId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const cls = await classService.getClass(parsedId);
      setClassData(cls);
      upsertClass(cls);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [parsedId, upsertClass]);

  useEffect(() => {
    loadClass();
  }, [loadClass]);

  const handleRefresh = async () => {
    if (!parsedId) return;
    setIsRefreshing(true);
    try {
      const cls = await classService.getClass(parsedId);
      setClassData(cls);
      upsertClass(cls);
    } catch {
      // Ignore background refresh failure
    } finally {
      setIsRefreshing(false);
    }
  };

  const isCoachOrOwner = isCoach || isOwner || classData?.myRole === 'OWNER' || classData?.myRole === 'COACH';

  if (isLoading && !isRefreshing && !classData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Class Details" showBack />
        <LoadingState message="Loading class..." />
      </SafeAreaView>
    );
  }

  if (errorMsg && !classData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AppHeader title="Class Details" showBack />
        <ErrorState
          error={errorMsg}
          onRetry={loadClass}
          title="Could Not Load Class"
        />
      </SafeAreaView>
    );
  }

  if (!classData) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title={classData.name} subtitle="Class Home" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        <View style={styles.mainContainer}>
          {/* Hero Header Card */}
          <View style={styles.heroCard}>
            <View style={styles.heroHeaderRow}>
              <View style={styles.badgeGroup}>
                {classData.level ? (
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelText}>{classData.level}</Text>
                  </View>
                ) : null}

                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>{classData.status}</Text>
                </View>
              </View>

              {isCoachOrOwner && (
                <View style={styles.coachActionsRow}>
                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => router.push(`/classes/${parsedId}/members` as any)}
                    accessibilityLabel="Manage members"
                  >
                    <Feather name="users" size={16} color={COLORS.primary} />
                    <Text style={styles.actionIconText}>Members</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.actionIconBtn}
                    onPress={() => router.push(`/classes/${parsedId}/edit` as any)}
                    accessibilityLabel="Edit class"
                  >
                    <Feather name="settings" size={16} color={COLORS.primary} />
                    <Text style={styles.actionIconText}>Edit</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text style={styles.className}>{classData.name}</Text>

            <View style={styles.heroMetaRow}>
              <View style={styles.metaCol}>
                <Feather name="user" size={14} color={COLORS.primary} />
                <Text style={styles.metaLabel}>
                  Coach: <Text style={styles.metaBold}>{classData.owner?.name || 'Coach'}</Text>
                </Text>
              </View>

              <View style={styles.metaCol}>
                <Feather name="users" size={14} color={COLORS.textBody} />
                <Text style={styles.metaLabel}>
                  {classData.memberCount} {classData.memberCount === 1 ? 'student' : 'students'}
                  {classData.maxStudents ? ` / ${classData.maxStudents}` : ''}
                </Text>
              </View>
            </View>
          </View>

          {/* Join Code Box (visible only for Coach / Owner) */}
          {isCoachOrOwner && classData.joinCode && (
            <JoinCodeBox
              joinCode={classData.joinCode}
              className={classData.name}
            />
          )}

          {/* Class Tabs Section */}
          <ClassTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            classItem={classData}
            onNavigateMembers={() => router.push(`/classes/${parsedId}/members` as any)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    width: '100%',
  },
  mainContainer: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  heroCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  levelBadge: {
    backgroundColor: COLORS.hero,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  statusBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  coachActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAF5',
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionIconText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  className: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 12,
  },
  heroMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  metaBold: {
    fontWeight: '700',
    color: COLORS.textHeading,
  },
});
