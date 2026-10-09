import React from 'react';
import { useAuthStore } from '../store/authStore';
import LoginScreen from './login';
import PlayHubScreen from './play';

/**
 * Root Application Gateway
 * 1. Shows LoginScreen first if user is not authenticated
 * 2. Shows PlayHubScreen (Mode Selection & Challenges) once logged in
 */
export default function RootScreen() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <PlayHubScreen isTab={false} />;
}
