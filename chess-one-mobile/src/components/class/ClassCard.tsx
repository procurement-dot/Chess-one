import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, SIZES, SHADOWS } from '../../constants/chessone-theme';
import { ClassDTO } from '../../types/class.types';

interface ClassCardProps {
  item: ClassDTO;
  onPress: () => void;
}

export const ClassCard: React.FC<ClassCardProps> = ({ item, onPress }) => {
  const isOwner = item.myRole === 'OWNER';
  const isCoach = item.myRole === 'COACH';

  const roleLabel = isOwner ? 'Owner' : isCoach ? 'Coach' : 'Student';
  const roleBg = isOwner ? '#E0E7FF' : isCoach ? '#DCFCE7' : '#F1F5F9';
  const roleColor = isOwner ? '#3730A3' : isCoach ? '#166534' : '#475569';

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Class ${item.name}`}
    >
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          {item.level ? (
            <View style={styles.levelBadge}>
              <Text style={styles.levelText}>{item.level}</Text>
            </View>
          ) : null}

          <View style={[styles.roleBadge, { backgroundColor: roleBg }]}>
            <Text style={[styles.roleText, { color: roleColor }]}>{roleLabel}</Text>
          </View>
        </View>

        <Feather name="chevron-right" size={20} color={COLORS.textBody} />
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {item.name}
      </Text>

      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <View style={styles.metaItem}>
          <Feather name="user" size={14} color={COLORS.primary} />
          <Text style={styles.metaText} numberOfLines={1}>
            {item.owner?.name ? item.owner.name : 'Coach'}
          </Text>
        </View>

        <View style={styles.metaItem}>
          <Feather name="users" size={14} color={COLORS.textBody} />
          <Text style={styles.metaText}>
            {item.memberCount} {item.memberCount === 1 ? 'student' : 'students'}
            {item.maxStudents ? ` / ${item.maxStudents}` : ''}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard || 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: COLORS.textBody,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    maxWidth: '50%',
  },
  metaText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
});
