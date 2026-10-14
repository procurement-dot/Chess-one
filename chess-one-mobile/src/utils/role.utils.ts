import { BackendRole } from '../types/auth.types';
import { UserRole } from '../features/roles/roleStore';

export const toAppRole = (backendRole: BackendRole): UserRole => {
  switch (backendRole) {
    case 'STUDENT':
    case 'PARENT': // Parent role removed, map to Student
      return 'Student';
    case 'COACH':
      return 'Coach';
    case 'SCHOOL':
      return 'School';
    case 'ORGANISER':
    case 'ADMIN':
      return 'Organizer';
    default:
      return 'Student';
  }
};

export const toBackendRole = (role: UserRole): BackendRole => {
  switch (role) {
    case 'Student':
      return 'STUDENT';
    case 'Coach':
      return 'COACH';
    case 'School':
      return 'SCHOOL';
    case 'Organizer':
    case 'Organiser':
      return 'ORGANISER';
    default:
      return 'STUDENT';
  }
};
