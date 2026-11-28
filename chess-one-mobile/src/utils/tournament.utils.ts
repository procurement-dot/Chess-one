import { COLORS } from '../constants/chessone-theme';
import type { TournamentStatus } from '../types/tournament.types';

export function formatStartsAt(iso: string): string {
  try {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;

    const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString(undefined, { month: 'short' });
    const time = date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });

    return `${weekday}, ${day} ${month} · ${time}`;
  } catch {
    return iso;
  }
}

export function statusLabel(status: TournamentStatus): string {
  switch (status) {
    case 'UPCOMING':
      return 'Upcoming';
    case 'ACTIVE':
      return 'Active';
    case 'COMPLETED':
      return 'Completed';
    case 'CANCELLED':
      return 'Cancelled';
    default:
      return status;
  }
}

export function statusColors(status: TournamentStatus): { bg: string; text: string } {
  switch (status) {
    case 'UPCOMING':
      return { bg: COLORS.hero, text: COLORS.primary };
    case 'ACTIVE':
      return { bg: '#DCFCE7', text: '#15803D' };
    case 'COMPLETED':
      return { bg: '#E3E8DE', text: COLORS.textBody };
    case 'CANCELLED':
      return { bg: '#FEE2E2', text: '#DC2626' };
    default:
      return { bg: COLORS.hero, text: COLORS.primary };
  }
}

export function friendlyTournamentError(code?: string): string {
  switch (code) {
    case 'TOURNAMENT_FULL':
      return 'This tournament is full.';
    case 'ALREADY_JOINED':
      return "You've already joined.";
    case 'TOURNAMENT_NOT_OPEN':
      return 'Joining is closed for this tournament.';
    case 'OWNER_CANNOT_JOIN':
      return "You can't join your own tournament.";
    case 'FORBIDDEN':
      return "You don't have permission to do this.";
    case 'MAX_PLAYERS_TOO_LOW':
      return "Max players can't be lower than players already joined.";
    case 'TOURNAMENT_NOT_EDITABLE':
      return "This tournament can't be edited any more.";
    case 'TOURNAMENT_ALREADY_STARTED':
      return 'This tournament has already started.';
    case 'NOT_ENOUGH_PLAYERS':
      return 'Need at least 2 players to start.';
    case 'TOURNAMENT_GAME_LOCKED':
      return "Tournament games can't be aborted.";
    case 'ROUND_NOT_FOUND':
      return 'Round not found.';
    case 'NOT_IN_TOURNAMENT':
      return 'You are not in this tournament.';
    default:
      return 'Something went wrong. Try again.';
  }
}

export function formatPairingResult(
  result: string | null,
  gameStatus: string | null
): { text: string; isLive: boolean } {
  if (result === 'BYE') {
    return { text: 'BYE (+1)', isLive: false };
  }
  if (result === 'WHITE_WIN' || result === '1-0') {
    return { text: '1 - 0', isLive: false };
  }
  if (result === 'BLACK_WIN' || result === '0-1') {
    return { text: '0 - 1', isLive: false };
  }
  if (result === 'DRAW' || result === '1/2-1/2' || result === '½-½') {
    return { text: '½ - ½', isLive: false };
  }
  if (result) {
    return { text: result, isLive: false };
  }
  if (gameStatus === 'ACTIVE') {
    return { text: 'Live', isLive: true };
  }
  return { text: '—', isLive: false };
}
