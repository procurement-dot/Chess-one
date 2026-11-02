import { useAuthStore } from '../store/authStore';
import { useClassStore } from '../store/classStore';
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
  const { user, isCoach: globalIsCoach, isAdmin } = useAuthStore();
  const { myRoleInClass } = useClassStore();

  const globalRole = (user?.role as UserRole) || 'PLAYER';

  // Dynamic role resolution from classStore
  const classRole = classId ? myRoleInClass(classId) : null;
  const isOwner = classRole === 'OWNER' || isAdmin;
  const isStudent = classRole === 'STUDENT';
  const isCoach = globalIsCoach || isAdmin || classRole === 'OWNER' || classRole === 'COACH';

  return {
    globalRole,
    isCoach,
    isAdmin,
    classRole,
    isOwner,
    isStudent,
  };
}
