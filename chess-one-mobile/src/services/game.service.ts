import { apiClient } from './apiClient';
import {
  CreateGameRequest,
  CreateGameResponse,
  Game,
  GameState,
  GameMove,
  GameInvitation,
  MakeMoveRequest,
  MakeMoveResponse,
  GameResultResponse,
  MyGamesResponse,
  AiReviewResponse,
  OnlineUser,
  QuickInviteResponse,
} from '../types/game.types';

class GameService {
  /**
   * Create a new match (PvP or PvAI)
   * POST /api/games
   */
  async createGame(params: CreateGameRequest): Promise<CreateGameResponse> {
    const res = await apiClient.post<{ success: boolean; game: CreateGameResponse }>('/api/games', params);
    return res.data.game;
  }

  /**
   * Get basic game details by ID or GameCode
   * GET /api/games/:gameId
   */
  async getGame(gameId: number | string): Promise<Game> {
    const res = await apiClient.get<{ success: boolean; game: Game }>(`/api/games/${gameId}`);
    return res.data.game;
  }

  /**
   * Get live game state with clocks
   * GET /api/games/:gameId/state
   */
  async getGameState(gameId: number | string): Promise<GameState> {
    const res = await apiClient.get<{ success: boolean; game: GameState }>(`/api/games/${gameId}/state`);
    return res.data.game;
  }

  /**
   * Join a waiting game directly using gameId or gameCode
   * POST /api/games/:gameId/join
   */
  async joinGame(gameId: number | string): Promise<{ game: any }> {
    const res = await apiClient.post<{ success: boolean; game: any }>(`/api/games/${gameId}/join`);
    return res.data.game;
  }

  /**
   * Cancel a waiting game (Creator only)
   * POST /api/games/:gameId/cancel
   */
  async cancelGame(gameId: number | string): Promise<{ gameId: number; status: string }> {
    const res = await apiClient.post<{ success: boolean; result: { gameId: number; status: string } }>(
      `/api/games/${gameId}/cancel`
    );
    return res.data.result;
  }

  /**
   * Invite an opponent to a waiting game
   * POST /api/games/:gameId/invite
   */
  async invitePlayer(gameId: number | string, opponentUserId: number): Promise<any> {
    const res = await apiClient.post<{ success: boolean; invitation: any }>(`/api/games/${gameId}/invite`, {
      opponentUserId,
    });
    return res.data.invitation;
  }

  /**
   * Get all active pending invitations for authenticated player
   * GET /api/invitations
   */
  async getInvitations(): Promise<GameInvitation[]> {
    const res = await apiClient.get<{ success: boolean; invitations: GameInvitation[] }>('/api/invitations');
    return res.data.invitations || [];
  }

  /**
   * Accept an invitation and start the game
   * POST /api/invitations/:invitationId/accept
   */
  async acceptInvitation(invitationId: number): Promise<Game> {
    const res = await apiClient.post<{ success: boolean; game: Game }>(`/api/invitations/${invitationId}/accept`);
    return res.data.game;
  }

  /**
   * Decline an invitation
   * POST /api/invitations/:invitationId/decline
   */
  async declineInvitation(invitationId: number): Promise<any> {
    const res = await apiClient.post<{ success: boolean; invitation: any }>(
      `/api/invitations/${invitationId}/decline`
    );
    return res.data.invitation;
  }

  /**
   * Cancel an invitation (alias for decline or dismissal)
   */
  async cancelInvitation(invitationId: number): Promise<any> {
    return this.declineInvitation(invitationId);
  }

  /**
   * Submit an authoritative chess move
   * POST /api/games/:gameId/moves
   */
  async makeMove(gameId: number | string, move: MakeMoveRequest): Promise<MakeMoveResponse> {
    const res = await apiClient.post<MakeMoveResponse>(`/api/games/${gameId}/moves`, move);
    return res.data;
  }

  /**
   * Get all completed moves for a game
   * GET /api/games/:gameId/moves
   */
  async getMoves(gameId: number | string): Promise<GameMove[]> {
    const res = await apiClient.get<{ success: boolean; moves: GameMove[] }>(`/api/games/${gameId}/moves`);
    return res.data.moves || [];
  }

  /**
   * Get formatted PGN notation of game
   * GET /api/games/:gameId/pgn
   */
  async getPGN(gameId: number | string): Promise<string> {
    const res = await apiClient.get<{ success: boolean; pgn: string } | string>(`/api/games/${gameId}/pgn`);
    if (typeof res.data === 'string') return res.data;
    return (res.data as any).pgn || '';
  }

  /**
   * Abort the active game (First move timeout or disconnect)
   * POST /api/games/:gameId/abort
   */
  async abortGame(gameId: number | string, reason: string = 'FIRST_MOVE_TIMEOUT'): Promise<any> {
    const res = await apiClient.post<{ success: boolean; result: any }>(`/api/games/${gameId}/abort`, {
      reason,
    });
    return res.data?.result || res.data;
  }

  /**
   * Resign the active game
   * POST /api/games/:gameId/resign
   */
  async resignGame(gameId: number | string): Promise<any> {
    const res = await apiClient.post(`/api/games/${gameId}/resign`);
    return res.data;
  }

  /**
   * Offer a draw to opponent
   * POST /api/games/:gameId/draw-offer
   */
  async offerDraw(gameId: number | string): Promise<any> {
    const res = await apiClient.post(`/api/games/${gameId}/draw-offer`);
    return res.data;
  }

  /**
   * Accept an incoming draw offer
   * POST /api/games/:gameId/draw-accept
   */
  async acceptDraw(gameId: number | string): Promise<any> {
    const res = await apiClient.post(`/api/games/${gameId}/draw-accept`);
    return res.data;
  }

  /**
   * Reject an incoming draw offer
   * POST /api/games/:gameId/draw-reject
   */
  async rejectDraw(gameId: number | string): Promise<any> {
    const res = await apiClient.post(`/api/games/${gameId}/draw-reject`);
    return res.data;
  }

  /**
   * Get authoritative game result
   * GET /api/games/:gameId/result
   */
  async getGameResult(gameId: number | string): Promise<GameResultResponse> {
    const res = await apiClient.get<GameResultResponse>(`/api/games/${gameId}/result`);
    return res.data;
  }

  /**
   * Get history of games for the authenticated user
   * GET /api/games/my-games
   */
  async getMyGames(params?: {
    status?: string;
    gameType?: string;
    page?: number;
    limit?: number;
  }): Promise<MyGamesResponse> {
    const res = await apiClient.get<MyGamesResponse>('/api/games/my-games', {
      params,
    });
    return res.data;
  }

  /**
   * Request Grandmaster AI Review for a match
   * POST /api/games/:gameId/ai-review
   */
  async getAiReview(gameId: number | string): Promise<AiReviewResponse> {
    const res = await apiClient.post<{ success: boolean; review: AiReviewResponse }>(
      `/api/games/${gameId}/ai-review`
    );
    return res.data.review;
  }

  /**
   * Fetch registered and online users for multiplayer challenges
   * GET /api/users
   */
  async getUsers(): Promise<OnlineUser[]> {
    const res = await apiClient.get<{ success: boolean; users: OnlineUser[] }>('/api/users');
    return res.data.users || [];
  }

  /**
   * 1-Click direct challenge to an opponent
   * POST /api/invitations/quick-invite
   */
  async quickInvite(opponentUserId: number, timeControl: string = '5+0'): Promise<QuickInviteResponse> {
    const res = await apiClient.post<QuickInviteResponse>('/api/invitations/quick-invite', {
      opponentUserId,
      timeControl,
    });
    return res.data;
  }
}

export const gameService = new GameService();
