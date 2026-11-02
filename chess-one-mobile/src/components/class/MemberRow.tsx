import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants/chessone-theme';
import { MemberDTO } from '../../types/class.types';

interface MemberRowProps {
  member: MemberDTO;
  isOwnerViewer?: boolean;
  isCoachViewer?: boolean;
  currentUserId?: number | null;
  onUpdateRole?: (member: MemberDTO, newRole: 'COACH' | 'STUDENT') => void;
  onRemove?: (member: MemberDTO) => void;
}

export const MemberRow: React.FC<MemberRowProps> = ({
  member,
  isOwnerViewer = false,
  isCoachViewer = false,
  currentUserId,
  onUpdateRole,
  onRemove,
}) => {
  const isSelf = currentUserId === member.userId;
  const isOwner = member.role === 'OWNER';
  const isCoach = member.role === 'COACH';
  const isStudent = member.role === 'STUDENT';

  const roleLabel = isOwner ? 'Owner' : isCoach ? 'Coach' : 'Student';
  const roleBg = isOwner ? '#E0E7FF' : isCoach ? '#DCFCE7' : '#F1F5F9';
  const roleColor = isOwner ? '#3730A3' : isCoach ? '#166534' : '#475569';

  const canManageRole = isOwnerViewer && !isOwner && !isSelf;
  const canRemove =
    !isOwner &&
    !isSelf &&
    (isOwnerViewer || (isCoachViewer && isStudent));

  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        {member.avatarUrl ? (
          <Image source={{ uri: member.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {(member.name || 'U')[0].toUpperCase()}
            </Text>
          </View>
        )}

        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
              {isSelf ? ' (You)' : ''}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
              <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
            </View>
          </View>

          {member.email ? (
            <Text style={styles.email} numberOfLines={1}>
              {member.email}
            </Text>
          ) : null}

          <Text style={styles.date}>
            Joined {new Date(member.joinedAt).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.actionsCol}>
        {canManageRole && onUpdateRole ? (
          <TouchableOpacity
            style={styles.roleActionBtn}
            onPress={() => onUpdateRole(member, isCoach ? 'STUDENT' : 'COACH')}
            activeOpacity={0.7}
          >
            <Text style={styles.roleActionText}>
              {isCoach ? 'Make Student' : 'Make Co-coach'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {canRemove && onRemove ? (
          <TouchableOpacity
            style={styles.removeBtn}
            onPress={() => onRemove(member)}
            activeOpacity={0.7}
            accessibilityLabel={`Remove ${member.name}`}
          >
            <Feather name="trash-2" size={16} color="#DC2626" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.hero,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  roleBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700',
  },
  email: {
    fontSize: 12,
    color: COLORS.textBody,
    marginBottom: 2,
  },
  date: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionsCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleActionBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  roleActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  removeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
});
