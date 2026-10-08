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
            <ActivityIndicator size="small" color="#94A3B8" />
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
                    <ActivityIndicator size="small" color="#FFFFFF" />
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
    color: '#202D29',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  badgeOnline: {
    backgroundColor: '#EEF3E8',
    borderColor: '#194E40',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#4F8A5B',
  },
  dotGray: {
    backgroundColor: '#74817A',
  },
  dotOffline: {
    backgroundColor: '#74817A',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#194E40',
  },
  refreshBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EEF3E8',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  refreshText: {
    fontSize: 12,
    color: '#194E40',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E9E1',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: '#74817A',
    textAlign: 'center',
  },
  list: {
    gap: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    gap: 12,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#194E40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarStatusDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    color: '#202D29',
    maxWidth: 140,
  },
  idChip: {
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  idChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#74817A',
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
    color: '#4F8A5B',
  },
  statusOfflineText: {
    color: '#74817A',
  },
  inviteBtn: {
    paddingVertical: 9,
    paddingHorizontal: 15,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inviteBtnOnline: {
    backgroundColor: '#194E40',
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  inviteBtnOffline: {
    backgroundColor: '#EEF3E8',
  },
  inviteBtnLoading: {
    opacity: 0.8,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
