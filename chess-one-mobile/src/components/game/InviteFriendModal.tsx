import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
  TextInput,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { OnlineUser } from '../../types/game.types';
import { useAuthStore } from '../../store/authStore';
import { ConnectionStatusPill } from '../ui/ConnectionStatusPill';

interface InviteFriendModalProps {
  visible: boolean;
  onlineUsers: OnlineUser[];
  allUsers?: OnlineUser[];
  isLoading: boolean;
  timeControl: string;
  invitingUserId: number | null;
  onInvite: (user: OnlineUser) => void;
  onRefresh: () => void;
  onClose: () => void;
}

export const InviteFriendModal: React.FC<InviteFriendModalProps> = ({
  visible,
  onlineUsers,
  allUsers = [],
  isLoading,
  timeControl,
  invitingUserId,
  onInvite,
  onRefresh,
  onClose,
}) => {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');

  // Automatically refresh players whenever modal opens
  useEffect(() => {
    if (visible) {
      onRefresh();
    }
  }, [visible, onRefresh]);

  // Filtered online candidates
  const currentList = useMemo(() => {
    let list = onlineUsers;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (u) =>
          (u.name && u.name.toLowerCase().includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          String(u.id).includes(q)
      );
    }
    return list;
  }, [onlineUsers, searchQuery]);

  if (!visible) return null;

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>👥</Text>
                <Text style={styles.title}>Invite Online Friend</Text>
              </View>
              <Text style={styles.subtitle}>
                Mode: {timeControl} • Challenge active school players
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Guest Sign-In Notice if not authenticated */}
          {!isAuthenticated && (
            <View style={styles.guestNotice}>
              <Text style={styles.guestNoticeText}>
                ⚠️ You are not signed in. Please sign in to send match invites.
              </Text>
              <TouchableOpacity
                style={styles.guestSignInBtn}
                activeOpacity={0.8}
                onPress={() => {
                  onClose();
                  router.push('/login' as any);
                }}
              >
                <Text style={styles.guestSignInBtnText}>Sign In</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Connection Status Indicator */}
          <ConnectionStatusPill onRetry={onRefresh} style={{ marginBottom: 6 }} />

          {/* Online Tab */}
          <View style={styles.tabBar}>
            <View style={[styles.tabBtn, styles.tabBtnActive, { flex: 1 }]}>
              <View style={styles.tabDot} />
              <Text style={[styles.tabBtnText, styles.tabBtnTextActive]}>
                Online Now ({onlineUsers.length})
              </Text>
            </View>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search by student name or ID..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={styles.clearSearchIcon}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Body List */}
          <View style={styles.body}>
            {isLoading && currentList.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#1E4B3A" />
                <Text style={styles.loadingText}>Checking active players...</Text>
              </View>
            ) : currentList.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>♟️</Text>
                <Text style={styles.emptyTitle}>
                  No other players online right now
                </Text>
                <Text style={styles.emptySubtitle}>
                  None of your school classmates are currently active.
                </Text>

                <TouchableOpacity
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                  onPress={onRefresh}
                >
                  <Text style={styles.refreshBtnText}>🔄 Refresh Players</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                showsVerticalScrollIndicator={false}
              >
                {currentList.map((item) => {
                  const isInviting = invitingUserId === item.id;
                  const initials = (item.name || item.email || 'P')[0].toUpperCase();

                  return (
                    <View key={`online-user-${item.id}`} style={styles.userCard}>
                      {/* Avatar */}
                      <View style={styles.avatarWrap}>
                        <View style={[styles.avatar, item.isOnline ? styles.avatarOnline : styles.avatarOffline]}>
                          <Text style={styles.avatarInitial}>{initials}</Text>
                        </View>
                        <View
                          style={[
                            styles.avatarDot,
                            item.isOnline ? styles.dotOnline : styles.dotOffline,
                          ]}
                        />
                      </View>

                      {/* Info */}
                      <View style={styles.infoCol}>
                        <View style={styles.nameRow}>
                          <Text style={styles.nameText} numberOfLines={1}>
                            {item.name || item.email}
                          </Text>
                          <View style={styles.idChip}>
                            <Text style={styles.idChipText}>#{item.id}</Text>
                          </View>
                        </View>
                        <Text style={[styles.onlineStatusText, !item.isOnline && styles.offlineStatusText]}>
                          {item.isOnline ? '🟢 Online & Ready' : '⚪ Offline'}
                        </Text>
                      </View>

                      {/* Invite Button */}
                      <TouchableOpacity
                        style={[
                          styles.inviteBtn,
                          !item.isOnline && styles.inviteBtnOffline,
                          isInviting && styles.btnLoading,
                        ]}
                        activeOpacity={0.8}
                        onPress={() => item.isOnline && onInvite(item)}
                        disabled={isInviting || !item.isOnline}
                      >
                        {isInviting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : !item.isOnline ? (
                          <Text style={styles.inviteBtnTextOffline}>Offline</Text>
                        ) : (
                          <Text style={styles.inviteBtnText}>⚔️ Invite</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  titleIcon: {
    fontSize: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  guestNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FCD34D',
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  guestNoticeText: {
    fontSize: 12,
    color: '#92400E',
    flex: 1,
    fontWeight: '600',
  },
  guestSignInBtn: {
    backgroundColor: '#1E4B3A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  guestSignInBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    padding: 3,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: '#1E4B3A',
  },
  tabDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#34D399',
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  clearSearchIcon: {
    fontSize: 14,
    color: '#94A3B8',
    paddingHorizontal: 4,
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  centerBox: {
    paddingVertical: 36,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#64748B',
    fontSize: 14,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  switchTabBtn: {
    backgroundColor: '#1E4B3A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    marginBottom: 10,
  },
  switchTabBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  refreshBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refreshBtnText: {
    color: '#1E4B3A',
    fontSize: 12,
    fontWeight: '700',
  },
  scrollList: {
    maxHeight: 340,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 40,
    height: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarOnline: {
    backgroundColor: '#DCFCE7',
  },
  avatarOffline: {
    backgroundColor: '#F1F5F9',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E4B3A',
  },
  avatarDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  dotOnline: {
    backgroundColor: '#22C55E',
  },
  dotOffline: {
    backgroundColor: '#94A3B8',
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
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 160,
  },
  idChip: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#16A34A',
  },
  offlineStatusText: {
    color: '#94A3B8',
  },
  inviteBtn: {
    backgroundColor: '#1E4B3A',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#1E4B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  inviteBtnOffline: {
    backgroundColor: '#E2E8F0',
    shadowOpacity: 0,
    elevation: 0,
  },
  btnLoading: {
    opacity: 0.7,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  inviteBtnTextOffline: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
});
