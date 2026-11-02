import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { authStore } from '../store/authStore';

let onUnauthorizedCallback: (() => void) | null = null;
let isLoggingOut = false;

/**
 * Register a global unauthorized callback (e.g. from _layout.tsx)
 * Used to avoid circular imports between apiClient, authStore, and router.
 */
export function setOnUnauthorized(cb: () => void) {
  onUnauthorizedCallback = cb;
}

/**
 * Resolve the backend API base URL based on platform and environment
 */
export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }

  // Fallback defaults for local development
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000';
  }
  return 'http://localhost:4000';
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

// Response interceptor for 401 Unauthorized handling and error extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ success?: boolean; error?: { code?: string; message?: string; details?: any } }>) => {
    const errorData = error.response?.data?.error;
    const errorMessage =
      errorData?.message ||
      error.message ||
      'An unexpected network error occurred. Please check your connection.';

    (error as any).userFriendlyMessage = errorMessage;
    (error as any).errorCode = errorData?.code;

    const status = error.response?.status;
    const url = error.config?.url || '';

    // Do NOT auto-logout on 401 from /api/auth/google or /api/auth/dev-login
    const isAuthLoginRoute = url.includes('/api/auth/google') || url.includes('/api/auth/dev-login');

    if (status === 401 && !isAuthLoginRoute) {
      const code = errorData?.code;
      if (!code || code === 'UNAUTHORIZED' || code === 'TOKEN_EXPIRED') {
        if (!isLoggingOut) {
          isLoggingOut = true;
          try {
            if (onUnauthorizedCallback) {
              onUnauthorizedCallback();
            } else {
              authStore.clearAuth();
            }
          } finally {
            setTimeout(() => {
              isLoggingOut = false;
            }, 3000);
          }
        }
      }
    }

    return Promise.reject(error);
  }
);
