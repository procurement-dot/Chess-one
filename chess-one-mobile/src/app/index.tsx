import React from 'react';
import { useAuthStore } from '../store/authStore';
import LoginScreen from './login';
import { HomeScreen } from '../features/home/HomeScreen';

/**
 * Root Application Gateway
 * 1. Shows LoginScreen first if user is not authenticated
 * 2. Shows HomeScreen once logged in
 */
export default function RootScreen() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <HomeScreen />;
}
