import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { GameInvitation } from '../../types/game.types';

interface InvitationCardProps {
  invitation: GameInvitation;
  onAccept: (invitationId: number) => void;
  onDecline: (invitationId: number) => void;
  isProcessing?: boolean;
}

export const InvitationCard: React.FC<InvitationCardProps> = ({
  invitation,
  onAccept,
  onDecline,
  isProcessing = false,
}) => {
  const senderName =
    invitation.sender?.name ||
    invitation.sender?.email?.split('@')[0] ||
    `Player #${invitation.senderId}`;

  const timeControl = invitation.game?.timeControl || '5+0';
  const gameCode = invitation.game?.gameCode;

  // Format creation timestamp
  const formattedDate = new Date(invitation.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {senderName.charAt(0).toUpperCase()}
          </Text>
        </View>

        <View style={styles.infoCol}>
          <Text style={styles.senderName} numberOfLines={1}>
            {senderName}
          </Text>
          <Text style={styles.subtext}>
            Challenged you • {timeControl} • {formattedDate}
          </Text>
          {gameCode && (
            <Text style={styles.codeBadge}>Code: {gameCode}</Text>
          )}
        </View>
      </View>

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          activeOpacity={0.7}
          disabled={isProcessing}
          onPress={() => onDecline(invitation.id)}
        >
          <Text style={styles.declineText}>Decline</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          activeOpacity={0.8}
          disabled={isProcessing}
          onPress={() => onAccept(invitation.id)}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="COLORS.textHeading" />
          ) : (
            <Text style={styles.acceptText}>Accept Challenge</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2F3642',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#262D38',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primary,
  },
  infoCol: {
    flex: 1,
  },
  senderName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textHeading,
    marginBottom: 2,
  },
  subtext: {
    fontSize: 13,
    color: COLORS.textBody,
  },
  codeBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  button: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineButton: {
    backgroundColor: '#262D38',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  declineText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  acceptText: {
    color: COLORS.textHeading,
    fontSize: 14,
    fontWeight: '700',
  },
});
