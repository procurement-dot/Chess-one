import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { AppHeader } from '../../../components/navigation/AppHeader';
import { COLORS, SIZES, SHADOWS } from '../../../constants/chessone-theme';
import { classService } from '../../../services/class.service';
import { useAuthStore } from '../../../store/authStore';
import { useClassRole } from '../../../hooks/useClassRole';
import { MemberDTO } from '../../../types/class.types';
import { MemberRow } from '../../../components/class/MemberRow';
import { LoadingState, ErrorState } from '../../../components/class';
import { getErrorMessage } from '../../../utils/classErrors';

export default function ClassMembersScreen() {
  const router = useRouter();
  const { classId } = useLocalSearchParams<{ classId: string }>();
  const parsedId = parseInt(classId || '0', 10);

  const { user } = useAuthStore();
  const { isCoach, isOwner } = useClassRole(parsedId);
  const currentUserId = user?.id ? parseInt(String(user.id), 10) : null;

  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Add member by email input
  const [addEmail, setAddEmail] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [addSuccess, setAddSuccess] = useState<string | null>(null);

  // Leave class state
  const [isLeaving, setIsLeaving] = useState(false);

  const loadMembers = useCallback(async () => {
    if (!parsedId) return;
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const data = await classService.getMembers(parsedId);
      setMembers(data);
    } catch (err) {
      setErrorMsg(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [parsedId]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await classService.getMembers(parsedId);
      setMembers(data);
    } catch {
      // Background error ignored
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAddMember = async () => {
    const emailTrimmed = addEmail.trim().toLowerCase();
    if (!emailTrimmed) {
      setAddError('Please enter an email address.');
      return;
    }

    setIsAdding(true);
    setAddError(null);
    setAddSuccess(null);

    try {
      const newMember = await classService.addMember(parsedId, emailTrimmed);
      setMembers((prev) => [...prev, newMember]);
      setAddEmail('');
      setAddSuccess(`Added ${newMember.name} to class.`);
      setTimeout(() => setAddSuccess(null), 3000);
    } catch (err) {
      setAddError(getErrorMessage(err));
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = (targetMember: MemberDTO, newRole: 'COACH' | 'STUDENT') => {
    const actionName = newRole === 'COACH' ? 'Make Co-coach' : 'Demote to Student';
    Alert.alert(
      actionName,
      `Are you sure you want to change ${targetMember.name}'s role to ${newRole}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const updated = await classService.updateMemberRole(
                parsedId,
                targetMember.userId,
                newRole
              );
              setMembers((prev) =>
                prev.map((m) => (m.userId === targetMember.userId ? updated : m))
              );
            } catch (err) {
              Alert.alert('Role Update Failed', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = (targetMember: MemberDTO) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${targetMember.name} from this class?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await classService.removeMember(parsedId, targetMember.userId);
              setMembers((prev) => prev.filter((m) => m.userId !== targetMember.userId));
            } catch (err) {
              Alert.alert('Remove Failed', getErrorMessage(err));
            }
          },
        },
      ]
    );
  };

  const handleLeaveClass = () => {
    Alert.alert(
      'Leave Class',
      'Are you sure you want to leave this class? You will need the join code to enroll again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Class',
          style: 'destructive',
          onPress: async () => {
            setIsLeaving(true);
            try {
              await classService.leaveClass(parsedId);
              router.replace('/classes' as any);
            } catch (err) {
              Alert.alert('Leave Failed', getErrorMessage(err));
              setIsLeaving(false);
            }
          },
        },
      ]
    );
  };

  // Group members into Owner, Coaches, Students
  const owners = members.filter((m) => m.role === 'OWNER');
  const coaches = members.filter((m) => m.role === 'COACH');
  const students = members.filter((m) => m.role === 'STUDENT');

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />
      <AppHeader title="Class Members" subtitle={`${members.length} members`} showBack />

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
          {isLoading && !isRefreshing && members.length === 0 ? (
            <LoadingState message="Loading members..." />
          ) : errorMsg && members.length === 0 ? (
            <ErrorState error={errorMsg} onRetry={loadMembers} />
          ) : (
            <View>
              {/* Coach: Add by email card */}
              {isCoach && (
                <View style={styles.addCard}>
                  <Text style={styles.addTitle}>Add Student by Email</Text>
                  <Text style={styles.addSub}>
                    Directly enroll a student into this batch using their account email.
                  </Text>

                  {addError ? (
                    <View style={styles.errorBox}>
                      <Text style={styles.errorText}>{addError}</Text>
                    </View>
                  ) : null}

                  {addSuccess ? (
                    <View style={styles.successBox}>
                      <Text style={styles.successText}>{addSuccess}</Text>
                    </View>
                  ) : null}

                  <View style={styles.addRow}>
                    <TextInput
                      style={styles.emailInput}
                      placeholder="student@example.com"
                      placeholderTextColor="#94A3B8"
                      value={addEmail}
                      onChangeText={(val) => {
                        setAddEmail(val);
                        if (addError) setAddError(null);
                      }}
                      autoCapitalize="none"
                      keyboardType="email-address"
                    />

                    <TouchableOpacity
                      style={[
                        styles.addBtn,
                        (!addEmail.trim() || isAdding) && styles.addBtnDisabled,
                      ]}
                      onPress={handleAddMember}
                      disabled={!addEmail.trim() || isAdding}
                      activeOpacity={0.8}
                    >
                      {isAdding ? (
                        <ActivityIndicator color={COLORS.white} size="small" />
                      ) : (
                        <Text style={styles.addBtnText}>Add</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Members Group: Owner & Coaches */}
              <View style={styles.groupSection}>
                <Text style={styles.groupHeader}>
                  Coaching Staff ({owners.length + coaches.length})
                </Text>

                <View style={styles.groupList}>
                  {owners.map((m) => (
                    <MemberRow
                      key={m.userId}
                      member={m}
                      isOwnerViewer={isOwner}
                      isCoachViewer={isCoach}
                      currentUserId={currentUserId}
                      onUpdateRole={handleUpdateRole}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                  {coaches.map((m) => (
                    <MemberRow
                      key={m.userId}
                      member={m}
                      isOwnerViewer={isOwner}
                      isCoachViewer={isCoach}
                      currentUserId={currentUserId}
                      onUpdateRole={handleUpdateRole}
                      onRemove={handleRemoveMember}
                    />
                  ))}
                </View>
              </View>

              {/* Members Group: Students */}
              <View style={styles.groupSection}>
                <Text style={styles.groupHeader}>
                  Enrolled Students ({students.length})
                </Text>

                <View style={styles.groupList}>
                  {students.length === 0 ? (
                    <Text style={styles.emptyGroupText}>
                      No students enrolled yet. Share your 6-character class code to invite students.
                    </Text>
                  ) : (
                    students.map((m) => (
                      <MemberRow
                        key={m.userId}
                        member={m}
                        isOwnerViewer={isOwner}
                        isCoachViewer={isCoach}
                        currentUserId={currentUserId}
                        onUpdateRole={handleUpdateRole}
                        onRemove={handleRemoveMember}
                      />
                    ))
                  )}
                </View>
              </View>

              {/* Student Action: Leave Class */}
              {!isOwner && (
                <View style={styles.leaveSection}>
                  <TouchableOpacity
                    style={styles.leaveBtn}
                    onPress={handleLeaveClass}
                    disabled={isLeaving}
                    activeOpacity={0.8}
                  >
                    {isLeaving ? (
                      <ActivityIndicator color="#DC2626" />
                    ) : (
                      <>
                        <Feather name="log-out" size={16} color="#DC2626" />
                        <Text style={styles.leaveBtnText}>Leave This Class</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
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
  addCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: SIZES.radiusCard || 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
    ...SHADOWS.soft,
  },
  addTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 4,
  },
  addSub: {
    fontSize: 12,
    color: COLORS.textBody,
    marginBottom: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    fontWeight: '600',
  },
  successBox: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  successText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  addRow: {
    flexDirection: 'row',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    backgroundColor: '#F8FAF5',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: COLORS.textHeading,
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 18,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  groupSection: {
    marginBottom: 20,
  },
  groupHeader: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: COLORS.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  groupList: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  emptyGroupText: {
    fontSize: 13,
    color: COLORS.textBody,
    paddingVertical: 16,
    textAlign: 'center',
  },
  leaveSection: {
    marginTop: 10,
    alignItems: 'center',
  },
  leaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEE2E2',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  leaveBtnText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
});
