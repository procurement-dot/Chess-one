import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { authStore } from '../store/authStore';

/**
 * Resolve the backend API base URL based on platform and environment
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  let resolvedUrl: string;

  if (envUrl && envUrl.trim()) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      resolvedUrl = envUrl.replace('localhost', '10.0.2.2');
    } else {
      resolvedUrl = envUrl.trim();
    }
  } else if (typeof window !== 'undefined' && window.location?.hostname) {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
    resolvedUrl = `${protocol}//${hostname}:4000`;
  } else if (Platform.OS === 'android') {
    resolvedUrl = 'http://10.0.2.2:4000';
  } else {
    resolvedUrl = 'http://localhost:4000';
  }

  if (__DEV__) {
    if ((globalThis as any).__lastResolvedApiUrl !== resolvedUrl) {
      console.log('[API] Resolved backend URL:', resolvedUrl);
      (globalThis as any).__lastResolvedApiUrl = resolvedUrl;
    }
  }

  return resolvedUrl;
}

/**
 * Resolve the Socket.IO base URL
 */
export function getSocketBaseUrl(): string {
  return getApiBaseUrl();
}

/**
 * Authoritative Axios HTTP client for ChessOne Mobile
 * Automatically attaches ChessOne JWT from authStore to all outgoing requests
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach Authorization Bearer token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically update baseURL if changed
    config.baseURL = getApiBaseUrl();

    let token = authStore.getState().chessOneToken;
    if (!token && typeof window !== 'undefined') {
      token = window.localStorage?.getItem('chess_one_token') || window.sessionStorage?.getItem('chess_one_token');
      if (token) {
        authStore.setChessOneToken(token);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export interface ForbiddenError extends Error {
  code: 'FORBIDDEN';
  status: 403;
  response?: unknown;
  userFriendlyMessage?: string;
  errorCode?: string;
}

export function isForbiddenError(err: unknown): err is ForbiddenError {
  return (
    typeof err === 'object' &&
    err !== null &&
    'code' in err &&
    (err as { code: unknown }).code === 'FORBIDDEN'
  );
}

// Response interceptor for consistent error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: { code?: string; message?: string } }>) => {
    const errorData = error.response?.data?.error;
    const errorMessage =
      errorData?.message ||
      error.message ||
      'An unexpected network error occurred. Please check your connection.';

    if (error.response?.status === 403 && errorData?.code === 'FORBIDDEN') {
      const serverMessage = errorData.message || 'You do not have permission to do this';
      const forbiddenErr = new Error(serverMessage) as ForbiddenError;
      forbiddenErr.code = 'FORBIDDEN';
      forbiddenErr.status = 403;
      forbiddenErr.response = error.response;
      forbiddenErr.userFriendlyMessage = serverMessage;
      forbiddenErr.errorCode = 'FORBIDDEN';
      return Promise.reject(forbiddenErr);
    }

    // Augment error with server message for cleaner UI display
    const augmentedError = error as AxiosError & { userFriendlyMessage?: string; errorCode?: string };
    augmentedError.userFriendlyMessage = errorMessage;
    augmentedError.errorCode = errorData?.code;

    if (error.response?.status === 401) {
      console.warn('[apiClient] 401 Unauthorized response for:', error.config?.url);
      const isAuthError =
        errorData?.code === 'TOKEN_EXPIRED' ||
        errorData?.code === 'UNAUTHORIZED' ||
        errorMessage?.includes('Invalid authentication token') ||
        errorMessage?.includes('Authenticated user no longer exists') ||
        errorMessage?.includes('Token has expired');

      if (isAuthError && authStore.getState().isAuthenticated) {
        console.warn('[apiClient] Stored token is invalid or expired. Resetting session.');
        authStore.clearAuth();
        if (typeof window !== 'undefined') {
          if (window.sessionStorage) {
            window.sessionStorage.setItem('auth_notice', 'Session expired, please sign in again');
          }
          if (window.location && !window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
      }
    }

    return Promise.reject(error);
  }
);
