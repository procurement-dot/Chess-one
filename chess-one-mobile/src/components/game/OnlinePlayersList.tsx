import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { OnlineUser } from '../../types/game.types';

interface OnlinePlayersListProps {
  users: OnlineUser[];
  isLoading: boolean;
  onlineCount: number;
  invitingUserId: number | null;
  onInvite: (user: OnlineUser) => void;
  onRefresh: () => void;
}

export const OnlinePlayersList: React.FC<OnlinePlayersListProps> = ({
  users,
  isLoading,
  onlineCount,
  invitingUserId,
  onInvite,
  onRefresh,
}) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithBadge}>
          <Text style={styles.titleIcon}>👥</Text>
          <Text style={styles.title}>Available Players</Text>
          <View style={[styles.badge, onlineCount > 0 && styles.badgeOnline]}>
            <View style={[styles.statusDot, onlineCount > 0 ? styles.dotGreen : styles.dotGray]} />
            <Text style={styles.badgeText}>
              {onlineCount} {onlineCount === 1 ? 'Online' : 'Online'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.7}
          onPress={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="COLORS.textBody" />
          ) : (
            <Text style={styles.refreshText}>🔄 Refresh</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Players List */}
      {users.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>♟️</Text>
          <Text style={styles.emptyTitle}>No other players found yet</Text>
          <Text style={styles.emptySub}>
            Invite your friends to register and play chess together!
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {users.map((item) => {
            const isThisInviting = invitingUserId === item.id;
            const initials = (item.name || item.email || 'P')[0].toUpperCase();

            return (
              <View key={`user-${item.id}`} style={styles.userCard}>
                {/* Avatar with Status Dot */}
                <View style={styles.avatarWrap}>
                  {item.avatarUrl ? (
                    <Image source={{ uri: item.avatarUrl }} style={styles.avatarImg} />
                  ) : (
                    <View style={styles.avatarFallback}>
                      <Text style={styles.avatarInitial}>{initials}</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.avatarStatusDot,
                      item.isOnline ? styles.dotGreen : styles.dotOffline,
                    ]}
                  />
                </View>

                {/* Player Info */}
                <View style={styles.infoCol}>
                  <View style={styles.nameRow}>
                    <Text style={styles.playerName} numberOfLines={1}>
                      {item.name || item.email}
                    </Text>
                    <View style={styles.idChip}>
                      <Text style={styles.idChipText}>#{item.id}</Text>
                    </View>
                  </View>

                  <View style={styles.statusRow}>
                    <Text
                      style={[
                        styles.statusText,
                        item.isOnline ? styles.statusOnlineText : styles.statusOfflineText,
                      ]}
                    >
                      {item.isOnline ? '🟢 Online & Ready' : '⚪ Offline'}
                    </Text>
                  </View>
                </View>

                {/* Direct Invite Button */}
                <TouchableOpacity
                  style={[
                    styles.inviteBtn,
                    item.isOnline ? styles.inviteBtnOnline : styles.inviteBtnOffline,
                    isThisInviting && styles.inviteBtnLoading,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => onInvite(item)}
                  disabled={isThisInviting}
                >
                  {isThisInviting ? (
                    <ActivityIndicator size="small" color="COLORS.textHeading" />
                  ) : (
                    <Text style={styles.inviteBtnText}>⚔️ Invite</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  badgeOnline: {
    backgroundColor: '#064E3B',
    borderColor: '#059669',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#10B981',
  },
  dotGray: {
    backgroundColor: '#64748B',
  },
  dotOffline: {
    backgroundColor: '#475569',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#1A202C',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  refreshText: {
    fontSize: 12,
    color: COLORS.textBody,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#151921',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E2530',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#232A36',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#161B22',
  },
  infoCol: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  playerName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F1F5F9',
    maxWidth: 140,
  },
  idChip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOnlineText: {
    color: '#34D399',
  },
  statusOfflineText: {
    color: '#64748B',
  },
  inviteBtn: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnOnline: {
    backgroundColor: '#4F46E5',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 3,
  },
  inviteBtnOffline: {
    backgroundColor: COLORS.border,
  },
  inviteBtnLoading: {
    opacity: 0.8,
  },
  inviteBtnText: {
    color: COLORS.textHeading,
    fontSize: 13,
    fontWeight: '700',
  },
});
