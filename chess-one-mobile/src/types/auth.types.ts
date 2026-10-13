export type BackendRole = 'STUDENT' | 'PARENT' | 'COACH' | 'SCHOOL' | 'ORGANISER' | 'ADMIN';

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  avatarUrl?: string | null;
  role: BackendRole;
  rating: number;
  gamesPlayed: number;
  school?: string | null;
  schoolClass?: string | null;
  level?: 'Beginner' | 'Developing' | 'Advanced' | null;
  fideId?: string | null;
  parentName?: string | null;
  parentEmail?: string | null;
  onboardingDone: boolean;
}

export type UpdateProfileRequest = Partial<
  Pick<
    UserProfile,
    'name' | 'school' | 'schoolClass' | 'level' | 'fideId' | 'parentName' | 'parentEmail'
  >
> & {
  role?: 'STUDENT' | 'PARENT';
};

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
  role?: BackendRole;
  rating?: number;
  gamesPlayed?: number;
  onboardingDone?: boolean;
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
