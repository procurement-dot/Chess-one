import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS, SIZES } from '../../constants/chessone-theme';
import { useCan } from '../../hooks/useCan';
import { StartTournamentModal } from './StartTournamentModal';
import type { TournamentDetails } from '../../types/tournament.types';

interface TournamentActionsProps {
  data: TournamentDetails;
  onJoin: () => Promise<unknown>;
  onLeave: () => Promise<unknown>;
  onCancel: () => Promise<unknown>;
  onStart?: () => Promise<unknown>;
  actionLoading: boolean;
  actionError: string | null;
}

export function TournamentActions({
  data,
  onJoin,
  onLeave,
  onCancel,
  onStart,
  actionLoading,
  actionError,
}: TournamentActionsProps) {
  const router = useRouter();
  const hasJoinPerm = useCan('TOURNAMENT_JOIN');

  const [confirmModal, setConfirmModal] = useState<'leave' | 'cancel' | null>(null);
  const [startModalVisible, setStartModalVisible] = useState(false);

  const { tournament, canJoin, canLeave, canEdit, canCancel, canStart, isJoined, isOwner } = data;

  const showJoin = canJoin && hasJoinPerm;
  const isFullAndNotJoined =
    tournament.status === 'UPCOMING' &&
    !isJoined &&
    tournament.playerCount >= tournament.maxPlayers &&
    !showJoin;

  const showNeedPlayers =
    isOwner &&
    tournament.status === 'UPCOMING' &&
    tournament.playerCount < 2;

  const handleEdit = () => {
    router.push(`/tournaments/create?editId=${tournament.id}` as any);
  };

  const handleConfirmLeave = async () => {
    setConfirmModal(null);
    try {
      await onLeave();
    } catch {}
  };

  const handleConfirmCancel = async () => {
    setConfirmModal(null);
    try {
      await onCancel();
    } catch {}
  };

  const handleConfirmStart = async () => {
    setStartModalVisible(false);
    try {
      if (onStart) {
        await onStart();
      }
    } catch {}
  };

  // If nothing to show and not full
  const hasAnyAction =
    showJoin ||
    canLeave ||
    canEdit ||
    canCancel ||
    canStart ||
    showNeedPlayers ||
    isFullAndNotJoined;

  if (!hasAnyAction) {
    return null;
  }

  return (
    <View style={styles.container}>
      {actionError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{actionError}</Text>
        </View>
      ) : null}

      <View style={styles.buttonRow}>
        {/* Full indicator */}
        {isFullAndNotJoined && (
          <View style={styles.fullBox}>
            <Text style={styles.fullText}>Tournament full</Text>
          </View>
        )}

        {/* Need at least 2 players note for owner */}
        {showNeedPlayers && (
          <View style={styles.needPlayersBox}>
            <Text style={styles.needPlayersText}>Need at least 2 players to start</Text>
          </View>
        )}

        {/* Start tournament button (Owner / Admin) */}
        {canStart && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            disabled={actionLoading}
            activeOpacity={0.8}
            onPress={() => setStartModalVisible(true)}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Start tournament</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Join button */}
        {showJoin && (
          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            disabled={actionLoading}
            activeOpacity={0.8}
            onPress={onJoin}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Join tournament</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Leave button */}
        {canLeave && (
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            disabled={actionLoading}
            activeOpacity={0.8}
            onPress={() => setConfirmModal('leave')}
          >
            {actionLoading ? (
              <ActivityIndicator color={COLORS.primary} size="small" />
            ) : (
              <Text style={styles.outlineButtonText}>Leave</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Edit button */}
        {canEdit && (
          <TouchableOpacity
            style={[styles.button, styles.outlineButton]}
            disabled={actionLoading}
            activeOpacity={0.8}
            onPress={handleEdit}
          >
            <Text style={styles.outlineButtonText}>Edit</Text>
          </TouchableOpacity>
        )}

        {/* Cancel button */}
        {canCancel && (
          <TouchableOpacity
            style={[styles.button, styles.dangerOutlineButton]}
            disabled={actionLoading}
            activeOpacity={0.8}
            onPress={() => setConfirmModal('cancel')}
          >
            <Text style={styles.dangerButtonText}>Cancel tournament</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Start Tournament Confirmation Modal */}
      <StartTournamentModal
        visible={startModalVisible}
        tournamentName={tournament.name}
        playerCount={tournament.playerCount}
        onConfirm={handleConfirmStart}
        onCancel={() => setStartModalVisible(false)}
        loading={actionLoading}
      />

      {/* Leave / Cancel Confirmation Modal */}
      <Modal
        visible={confirmModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmModal(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmModal(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.modalIconCircle,
                confirmModal === 'cancel' && styles.modalIconCircleDanger,
              ]}
            >
              <Text style={styles.modalIconText}>
                {confirmModal === 'cancel' ? '⚠️' : '🚪'}
              </Text>
            </View>

            <Text style={styles.modalTitle}>
              {confirmModal === 'cancel' ? 'Cancel Tournament?' : 'Leave Tournament?'}
            </Text>

            <Text style={styles.modalMessage}>
              {confirmModal === 'cancel'
                ? "Are you sure you want to cancel this tournament? Players will be told it's cancelled."
                : 'Are you sure you want to leave? Your registration will be cancelled.'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                activeOpacity={0.7}
                onPress={() => setConfirmModal(null)}
              >
                <Text style={styles.modalCancelButtonText}>Go back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  confirmModal === 'cancel'
                    ? styles.modalDangerButton
                    : styles.modalPrimaryButton,
                ]}
                activeOpacity={0.8}
                onPress={confirmModal === 'cancel' ? handleConfirmCancel : handleConfirmLeave}
              >
                <Text style={styles.modalActionButtonText}>
                  {confirmModal === 'cancel' ? 'Cancel it' : 'Leave'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '600',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  fullBox: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    borderRadius: SIZES.radiusInput,
    alignItems: 'center',
  },
  fullText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textBody,
  },
  needPlayersBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: SIZES.radiusInput,
    alignItems: 'center',
  },
  needPlayersText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: SIZES.radiusInput,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.white,
  },
  outlineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  outlineButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
  },
  dangerOutlineButton: {
    backgroundColor: COLORS.white,
    borderWidth: 1.5,
    borderColor: '#DC2626',
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#DC2626',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  modalIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EEF2E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalIconCircleDanger: {
    backgroundColor: '#FEE2E2',
  },
  modalIconText: {
    fontSize: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textHeading,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: COLORS.textBody,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#F1F5F9',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  modalPrimaryButton: {
    backgroundColor: COLORS.primary,
  },
  modalDangerButton: {
    backgroundColor: '#DC2626',
  },
  modalActionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
});
