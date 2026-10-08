import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { OnlineUser } from '../../types/game.types';

interface InviteFriendModalProps {
  visible: boolean;
  onlineUsers: OnlineUser[];
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
  isLoading,
  timeControl,
  invitingUserId,
  onInvite,
  onRefresh,
  onClose,
}) => {
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
                Mode: {timeControl} • Only active online players are shown
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

          {/* Body */}
          <View style={styles.body}>
            {isLoading && onlineUsers.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color="#194E40" />
                <Text style={styles.loadingText}>Checking online players...</Text>
              </View>
            ) : onlineUsers.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>♟️</Text>
                <Text style={styles.emptyTitle}>No players currently online</Text>
                <Text style={styles.emptySubtitle}>
                  None of your friends are currently active in the app.
                </Text>
                <Text style={styles.emptyHint}>
                  💡 Tip: You can close this and tap &quot;Create Room&quot; to generate a 6-digit game code to share with your friend!
                </Text>

                <TouchableOpacity
                  style={styles.refreshBtn}
                  activeOpacity={0.8}
                  onPress={onRefresh}
                >
                  <Text style={styles.refreshBtnText}>🔄 Check Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView
                style={styles.scrollList}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.onlineBadgeRow}>
                  <View style={styles.statusDot} />
                  <Text style={styles.onlineCountText}>
                    {onlineUsers.length} Player{onlineUsers.length > 1 ? 's' : ''} Online Now
                  </Text>
                </View>

                {onlineUsers.map((item) => {
                  const isInviting = invitingUserId === item.id;
                  const initials = (item.name || item.email || 'P')[0].toUpperCase();

                  return (
                    <View key={`online-user-${item.id}`} style={styles.userCard}>
                      {/* Avatar */}
                      <View style={styles.avatarWrap}>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarInitial}>{initials}</Text>
                        </View>
                        <View style={styles.avatarDot} />
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
                        <Text style={styles.onlineStatusText}>🟢 Ready to Play</Text>
                      </View>

                      {/* Invite Button */}
                      <TouchableOpacity
                        style={[styles.inviteBtn, isInviting && styles.btnLoading]}
                        activeOpacity={0.8}
                        onPress={() => onInvite(item)}
                        disabled={isInviting}
                      >
                        {isInviting ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
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
    backgroundColor: 'rgba(32, 45, 41, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '75%',
    borderWidth: 1,
    borderColor: '#E4E9E1',
    paddingBottom: 32,
    shadowColor: '#202D29',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E9E1',
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
    color: '#202D29',
  },
  subtitle: {
    fontSize: 12,
    color: '#74817A',
    marginTop: 2,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EEF3E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#74817A',
    fontSize: 15,
    fontWeight: '700',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  centerBox: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: '#74817A',
    fontSize: 14,
  },
  emptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 44,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202D29',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#74817A',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptyHint: {
    fontSize: 12,
    color: '#74817A',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  refreshBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#EEF3E8',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D5DFC8',
  },
  refreshBtnText: {
    color: '#194E40',
    fontSize: 13,
    fontWeight: '700',
  },
  scrollList: {
    maxHeight: 320,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F8A5B',
  },
  onlineCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#194E40',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F7F2',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E9E1',
    marginBottom: 10,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
    width: 42,
    height: 42,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#194E40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4F8A5B',
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
  nameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202D29',
    maxWidth: 140,
  },
  idChip: {
    backgroundColor: '#EEF3E8',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  idChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#74817A',
  },
  onlineStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4F8A5B',
  },
  inviteBtn: {
    backgroundColor: '#194E40',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: '#194E40',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  btnLoading: {
    opacity: 0.7,
  },
  inviteBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
