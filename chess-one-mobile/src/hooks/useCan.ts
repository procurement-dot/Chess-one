import { useAuthStore } from '../store/authStore';
import { useRoleStore } from '../features/roles/roleStore';
import { toBackendRole } from '../utils/role.utils';
import type { BackendRole } from '../types/auth.types';
import { Permission, hasPermission } from '../constants/permissions';

export function useRole(): BackendRole | null {
  const uiRole = useRoleStore();
  const { user } = useAuthStore();

  // If the user has a selected role in the UI role switcher, let it drive the active view role
  if (uiRole) {
    if (user?.role === 'ADMIN' && (uiRole === 'Organizer' || uiRole === 'Organiser')) {
      return 'ADMIN';
    }
    return toBackendRole(uiRole);
  }
  return user?.role ?? null;
}

export function useCan(permission: Permission): boolean {
  const role = useRole();
  return hasPermission(role, permission);
}

export function useIsOwner(ownerId: number | null | undefined): boolean {
  const { user } = useAuthStore();
  const role = useRole();
  if (!user || ownerId === null || ownerId === undefined) return false;
  if (role === 'ADMIN' || user.role === 'ADMIN') return true;
  const userId = Number(user.id);
  const targetId = Number(ownerId);
  if (Number.isNaN(userId) || Number.isNaN(targetId)) return false;
  return userId === targetId;
}
