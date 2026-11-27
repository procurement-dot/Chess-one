// Must match chess-one-backend/src/config/permissions.js
import type { BackendRole } from '../types/auth.types';

export const PERMISSIONS = {
  TOURNAMENT_VIEW:     ['STUDENT', 'PARENT', 'COACH', 'SCHOOL', 'ORGANISER'],
  TOURNAMENT_CREATE:   ['ORGANISER'],
  TOURNAMENT_MANAGE:   ['ORGANISER'],
  TOURNAMENT_JOIN:     ['STUDENT'],
  CLASS_MANAGE:        ['COACH', 'SCHOOL'],
  CHILD_PROGRESS_VIEW: ['PARENT'],
} as const satisfies Record<string, readonly BackendRole[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: BackendRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  if (role === 'ADMIN') return true;
  return (PERMISSIONS[permission] as readonly BackendRole[]).includes(role);
}
