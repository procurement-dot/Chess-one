import { useAuthStore } from '../store/authStore';
import { UserRole, ClassRole } from '../types/class.types';

export interface UseClassRoleResult {
  globalRole: UserRole;
  isCoach: boolean;
  isAdmin: boolean;
  classRole: ClassRole | null;
  isOwner: boolean;
  isStudent: boolean;
}

/**
 * Hook to inspect user permissions and roles within global app and class context
 * @param classId - Optional class context ID
 */
export function useClassRole(classId?: number): UseClassRoleResult {
  const { user, isCoach, isAdmin } = useAuthStore();

  const globalRole = (user?.role as UserRole) || 'PLAYER';

  // For Phase 0: classRole is null, isOwner and isStudent are false.
  // Phase 1 will resolve these dynamically from class membership store.
  const classRole: ClassRole | null = null;
  const isOwner = false;
  const isStudent = false;

  return {
    globalRole,
    isCoach,
    isAdmin,
    classRole,
    isOwner,
    isStudent,
  };
}
