import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { ClassDTO } from '../../types/class.types';

export type ClassTabKey =
  | 'overview'
  | 'schedule'
  | 'lessons'
  | 'homework'
  | 'members'
  | 'progress';

interface ClassTabsProps {
  activeTab: ClassTabKey;
  onTabChange: (tab: ClassTabKey) => void;
  classItem: ClassDTO;
  onNavigateMembers?: () => void;
}

const TABS: { key: ClassTabKey; label: string; icon: keyof typeof Feather.glyphMap }[] = [
  { key: 'overview', label: 'Overview', icon: 'info' },
  { key: 'schedule', label: 'Schedule', icon: 'calendar' },
  { key: 'lessons', label: 'Lessons', icon: 'book-open' },
  { key: 'homework', label: 'Homework', icon: 'file-text' },
  { key: 'members', label: 'Members', icon: 'users' },
  { key: 'progress', label: 'Progress', icon: 'trending-up' },
];

export const ClassTabs: React.FC<ClassTabsProps> = ({
  activeTab,
  onTabChange,
  classItem,
  onNavigateMembers,
}) => {
  return (
    <View style={styles.container}>
      {/* Horizontal Tab Bar */}
      <View style={styles.tabBarWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[styles.tabItem, isActive && styles.tabItemActive]}
                onPress={() => onTabChange(tab.key)}
                activeOpacity={0.7}
              >
                <Feather
                  name={tab.icon}
                  size={14}
                  color={isActive ? COLORS.primary : COLORS.textBody}
                />
                <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Tab Content */}
      <View style={styles.contentContainer}>
        {activeTab === 'overview' && (
          <View style={styles.overviewBox}>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>About This Class</Text>
              <Text style={styles.descriptionText}>
                {classItem.description || 'No description provided for this class.'}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {classItem.level || 'All Levels'}
                </Text>
                <Text style={styles.statLabel}>Skill Level</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {classItem.memberCount}
                  {classItem.maxStudents ? ` / ${classItem.maxStudents}` : ''}
                </Text>
                <Text style={styles.statLabel}>Active Students</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {classItem.timezone || 'Asia/Kolkata'}
                </Text>
                <Text style={styles.statLabel}>Timezone</Text>
              </View>
            </View>

            <View style={styles.nextSessionCard}>
              <View style={styles.nextSessionIcon}>
                <Feather name="clock" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.nextSessionTextCol}>
                <Text style={styles.nextSessionTitle}>Next Class Session</Text>
                <Text style={styles.nextSessionSub}>
                  No live session currently scheduled.
                </Text>
              </View>
            </View>

            {onNavigateMembers ? (
              <TouchableOpacity
                style={styles.viewMembersBtn}
                onPress={onNavigateMembers}
                activeOpacity={0.8}
              >
                <Feather name="users" size={16} color={COLORS.primary} />
                <Text style={styles.viewMembersBtnText}>
                  View Class Members ({classItem.memberCount})
                </Text>
                <Feather name="arrow-right" size={16} color={COLORS.primary} />
              </TouchableOpacity>
            ) : null}
          </View>
        )}

        {(activeTab === 'schedule' ||
          activeTab === 'lessons' ||
          activeTab === 'homework' ||
          activeTab === 'progress') && (
          <View style={styles.comingSoonBox}>
            <View style={styles.comingSoonIconCircle}>
              <Feather name="zap" size={28} color={COLORS.primary} />
            </View>
            <Text style={styles.comingSoonTitle}>Coming Soon</Text>
            <Text style={styles.comingSoonDesc}>
              {activeTab === 'schedule' &&
                'Class schedules, upcoming video meetings, and live attendance tracking are coming in Phase 2.'}
              {activeTab === 'lessons' &&
                'Interactive board lessons, opening theory, and tactical demonstrations are coming in Phase 2.'}
              {activeTab === 'homework' &&
                'Weekly chess puzzle assignments and submission review are coming in Phase 3.'}
              {activeTab === 'progress' &&
                'Student attendance analytics and performance ratings are coming in Phase 3.'}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  tabBarWrapper: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    gap: 4,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  contentContainer: {
    paddingVertical: 16,
  },
  overviewBox: {
    gap: 14,
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.radiusCard || 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: COLORS.textBody,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textBody,
    fontWeight: '600',
    textAlign: 'center',
  },
  nextSessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAF5',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  nextSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextSessionTextCol: {
    flex: 1,
  },
  nextSessionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  nextSessionSub: {
    fontSize: 12,
    color: COLORS.textBody,
  },
  viewMembersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginTop: 4,
  },
  viewMembersBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  comingSoonBox: {
    backgroundColor: COLORS.white,
    padding: 32,
    borderRadius: SIZES.radiusCard || 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  comingSoonIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.hero,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 8,
  },
  comingSoonDesc: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 400,
  },
});
