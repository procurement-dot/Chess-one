import { apiClient } from './apiClient';
import { UserProfile, UpdateProfileRequest } from '../types/auth.types';

export const getMyProfile = async (): Promise<UserProfile> => {
  const res = await apiClient.get<{ success: boolean; user?: UserProfile } & Partial<UserProfile>>(
    '/api/users/me'
  );
  return (res.data.user ?? res.data) as UserProfile;
};

export const updateMyProfile = async (body: UpdateProfileRequest): Promise<UserProfile> => {
  const res = await apiClient.patch<{ success: boolean; user?: UserProfile } & Partial<UserProfile>>(
    '/api/users/me',
    body
  );
  return (res.data.user ?? res.data) as UserProfile;
};

export const userService = {
  getMyProfile,
  updateMyProfile,
};
