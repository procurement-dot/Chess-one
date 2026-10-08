/**
 * Google user identity extracted from Google OAuth result or ID token
 */
export interface GoogleUser {
  id?: string;
  email?: string;
  name?: string;
  photo?: string;
  givenName?: string;
  familyName?: string;
}

/**
 * Result returned by the mobile Google authentication flow
 */
export interface GoogleAuthResult {
  success: boolean;
  idToken?: string;
  accessToken?: string;
  user?: GoogleUser;
  chessOneToken?: string;
  error?: string;
  cancelled?: boolean;
}

/**
 * Mobile authentication state with ChessOne backend JWT
 */
export interface AuthState {
  isAuthenticated: boolean;
  user: GoogleUser | null;
  googleIdToken: string | null;
  chessOneToken: string | null;
  isLoading: boolean;
  error: string | null;
}
