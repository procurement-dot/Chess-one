import { isAxiosError } from 'axios';
import { apiClient, isForbiddenError } from './apiClient';
import type {
  TournamentListItem,
  TournamentDetails,
  CreateTournamentRequest,
  UpdateTournamentRequest,
  TournamentListQuery,
  TournamentRound,
  MyGame,
} from '../types/tournament.types';

function extractError(err: unknown): Error & { code?: string } {
  if (isForbiddenError(err)) {
    const errorObj = new Error(err.message) as Error & { code: string };
    errorObj.code = 'FORBIDDEN';
    return errorObj;
  }
  if (isAxiosError(err)) {
    const errPayload = err.response?.data?.error;
    const code = errPayload?.code || (err as { errorCode?: string }).errorCode || 'UNKNOWN_ERROR';
    const message = errPayload?.message || err.message || 'An error occurred';
    const errorObj = new Error(message) as Error & { code: string };
    errorObj.code = code;
    return errorObj;
  }
  if (err instanceof Error) {
    const errorObj = err as Error & { code?: string };
    const errRecord = err as unknown as Record<string, unknown>;
    if (!errorObj.code && 'code' in errRecord) {
      errorObj.code = String(errRecord.code);
    }
    return errorObj;
  }
  return new Error('Something went wrong. Try again.');
}

export async function getTournaments(query?: TournamentListQuery): Promise<{
  tournaments: TournamentListItem[];
  page: number;
  limit: number;
  total: number;
}> {
  try {
    const res = await apiClient.get('/api/tournaments', { params: query });
    return {
      tournaments: res.data.tournaments ?? [],
      page: res.data.page ?? 1,
      limit: res.data.limit ?? 20,
      total: res.data.total ?? 0,
    };
  } catch (err) {
    throw extractError(err);
  }
}

export async function getTournament(id: number): Promise<TournamentDetails> {
  try {
    const res = await apiClient.get(`/api/tournaments/${id}`);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function createTournament(body: CreateTournamentRequest): Promise<TournamentDetails> {
  try {
    const res = await apiClient.post('/api/tournaments', body);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function updateTournament(
  id: number,
  body: UpdateTournamentRequest
): Promise<TournamentDetails> {
  try {
    const res = await apiClient.patch(`/api/tournaments/${id}`, body);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function cancelTournament(id: number): Promise<TournamentDetails> {
  try {
    const res = await apiClient.post(`/api/tournaments/${id}/cancel`);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function joinTournament(id: number): Promise<TournamentDetails> {
  try {
    const res = await apiClient.post(`/api/tournaments/${id}/join`);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function leaveTournament(id: number): Promise<TournamentDetails> {
  try {
    const res = await apiClient.post(`/api/tournaments/${id}/leave`);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function startTournament(id: number): Promise<TournamentDetails> {
  try {
    const res = await apiClient.post(`/api/tournaments/${id}/start`);
    return res.data as TournamentDetails;
  } catch (err) {
    throw extractError(err);
  }
}

export async function getRound(id: number, roundNumber: number): Promise<{ round: TournamentRound }> {
  try {
    const res = await apiClient.get(`/api/tournaments/${id}/rounds/${roundNumber}`);
    return res.data as { round: TournamentRound };
  } catch (err) {
    throw extractError(err);
  }
}

export async function getMyGame(id: number): Promise<MyGame> {
  try {
    const res = await apiClient.get(`/api/tournaments/${id}/my-game`);
    return res.data as MyGame;
  } catch (err) {
    throw extractError(err);
  }
}

export const tournamentService = {
  getTournaments,
  getTournament,
  createTournament,
  updateTournament,
  cancelTournament,
  joinTournament,
  leaveTournament,
  startTournament,
  getRound,
  getMyGame,
};
