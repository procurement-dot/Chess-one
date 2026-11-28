export type TournamentFormat = 'ROUND_ROBIN' | 'SWISS';
export type TournamentStatus = 'UPCOMING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type RoundStatus = 'PENDING' | 'ACTIVE' | 'COMPLETED';

export interface TournamentListItem {
  id: number;
  name: string;
  format: TournamentFormat;
  status: TournamentStatus;
  timeControl: string;
  startsAt: string;
  maxPlayers: number;
  playerCount: number;
  isRated: boolean;
  organiser: { id: number; name: string };
  isJoined: boolean;
  isOwner: boolean;
  currentRound?: number;
  totalRounds?: number | null;
}

export interface TournamentPlayer {
  userId: number;
  name: string;
  avatarUrl?: string | null;
  rating: number;
  score: number;
  seed?: number | null;
  joinedAt: string;
}

export interface PairingPlayer {
  id: number;
  name: string;
  rating: number;
}

export interface TournamentPairing {
  id: number;
  boardNumber: number;
  white: PairingPlayer;
  black: PairingPlayer | null;
  gameId: number | null;
  gameStatus: string | null;
  result: string | null;
}

export interface TournamentRound {
  roundNumber: number;
  status: RoundStatus;
  startedAt?: string | null;
  finishedAt?: string | null;
  pairings: TournamentPairing[];
}

export type MyGame =
  | {
      roundNumber: number;
      boardNumber: number;
      gameId: number;
      gameCode: string;
      color: 'WHITE' | 'BLACK';
      opponent: PairingPlayer;
      gameStatus: string;
      bye?: false;
    }
  | {
      roundNumber: number;
      bye: true;
      gameId: null;
    }
  | {
      gameId: null;
      status: TournamentStatus;
      bye?: false;
    };

export interface RoundStartedEvent {
  tournamentId: number;
  roundNumber: number;
  pairings: TournamentPairing[];
}

export interface YourGameEvent {
  tournamentId: number;
  tournamentName?: string;
  roundNumber: number;
  boardNumber?: number;
  gameId?: number;
  color?: 'WHITE' | 'BLACK';
  opponent?: PairingPlayer;
  bye?: boolean;
}

export interface TournamentUpdatedEvent {
  tournamentId: number;
  reason: string;
}

export interface TournamentDetails {
  tournament: TournamentListItem & {
    description?: string | null;
    totalRounds: number | null;
    currentRound: number;
    createdAt: string;
    organiser: { id: number; name: string; avatarUrl?: string | null };
  };
  players: TournamentPlayer[];
  rounds: { roundNumber: number; status: RoundStatus }[];
  canStart: boolean;
  isPlayer: boolean;
  isOwner: boolean;
  isJoined: boolean;
  canJoin: boolean;
  canLeave: boolean;
  canEdit: boolean;
  canCancel: boolean;
}

export interface CreateTournamentRequest {
  name: string;
  description?: string | null;
  format: TournamentFormat;
  timeControl: string;
  maxPlayers: number;
  startsAt: string;
  isRated?: boolean;
}

export type UpdateTournamentRequest = Partial<CreateTournamentRequest>;

export interface TournamentListQuery {
  status?: TournamentStatus;
  mine?: boolean;
  page?: number;
  limit?: number;
}
