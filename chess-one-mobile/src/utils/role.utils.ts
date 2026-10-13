import { BackendRole } from '../types/auth.types';
import { UserRole } from '../features/roles/roleStore';

export const toAppRole = (backendRole: BackendRole): UserRole => {
  switch (backendRole) {
    case 'STUDENT':
      return 'Student';
    case 'PARENT':
      return 'Parent';
    case 'COACH':
      return 'Coach';
    case 'SCHOOL':
      return 'School';
    case 'ORGANISER':
    case 'ADMIN':
      return 'Organiser';
    default:
      return 'Student';
  }
};

export const toBackendRole = (role: UserRole): BackendRole => {
  switch (role) {
    case 'Student':
      return 'STUDENT';
    case 'Parent':
      return 'PARENT';
    case 'Coach':
      return 'COACH';
    case 'School':
      return 'SCHOOL';
    case 'Organiser':
      return 'ORGANISER';
    default:
      return 'STUDENT';
  }
};
