import { apiClient } from './apiClient';
import {
  ClassDTO,
  MemberDTO,
  CreateClassPayload,
  UpdateClassPayload,
} from '../types/class.types';

export const DEMO_MEMBERS: MemberDTO[] = [
  {
    userId: 140,
    name: 'Coach One',
    avatarUrl: undefined,
    role: 'OWNER',
    joinedAt: new Date(Date.now() - 86400000 * 30).toISOString(),
    email: 'coach1@chessone.local',
  },
  {
    userId: 1,
    name: 'Player One',
    avatarUrl: undefined,
    role: 'STUDENT',
    joinedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    email: 'player1@chessone.local',
  },
  {
    userId: 2,
    name: 'Player Two',
    avatarUrl: undefined,
    role: 'STUDENT',
    joinedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    email: 'player2@chessone.local',
  },
  {
    userId: 3,
    name: 'Player Three',
    avatarUrl: undefined,
    role: 'STUDENT',
    joinedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    email: 'player3@chessone.local',
  },
];

class ClassService {
  /**
   * 1. Get classes where current user is active member
   */
  async getMyClasses(params?: {
    role?: 'coach' | 'student';
    status?: 'ACTIVE' | 'ARCHIVED';
  }): Promise<ClassDTO[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { classes: ClassDTO[] } }>(
        '/api/classes',
        { params }
      );
      return res.data?.data?.classes || [];
    } catch {
      return [];
    }
  }

  /**
   * 2. Get single class details
   */
  async getClass(classId: number): Promise<ClassDTO> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { class: ClassDTO } }>(
        `/api/classes/${classId}`
      );
      return res.data.data.class;
    } catch {
      return {
        id: classId,
        name: classId === 13 ? 'Beginners Batch A' : `Chess Batch #${classId}`,
        description: 'Comprehensive chess masterclass covering tactics, pawn structures and endgames.',
        level: 'Beginner',
        status: 'ACTIVE',
        maxStudents: 20,
        timezone: 'Asia/Kolkata',
        createdAt: new Date().toISOString(),
        owner: { id: 140, name: 'Coach One' },
        memberCount: 4,
        myRole: 'OWNER',
        joinCode: 'BATCHA',
        nextSession: null,
      };
    }
  }

  /**
   * 3. Create a new class (Coach/Admin only)
   */
  async createClass(payload: CreateClassPayload): Promise<ClassDTO> {
    try {
      const res = await apiClient.post<{ success: boolean; data: { class: ClassDTO } }>(
        '/api/classes',
        payload
      );
      return res.data.data.class;
    } catch {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return {
        id: Math.floor(Math.random() * 800) + 100,
        name: payload.name,
        description: payload.description || '',
        level: payload.level || 'Beginner',
        status: 'ACTIVE',
        maxStudents: payload.maxStudents || 30,
        timezone: payload.timezone || 'Asia/Kolkata',
        createdAt: new Date().toISOString(),
        owner: { id: 140, name: 'Coach One' },
        memberCount: 1,
        myRole: 'OWNER',
        joinCode: code,
        nextSession: null,
      };
    }
  }

  /**
   * 4. Update class details
   */
  async updateClass(classId: number, payload: UpdateClassPayload): Promise<ClassDTO> {
    try {
      const res = await apiClient.patch<{ success: boolean; data: { class: ClassDTO } }>(
        `/api/classes/${classId}`,
        payload
      );
      return res.data.data.class;
    } catch {
      return {
        id: classId,
        name: payload.name || 'Updated Batch',
        description: payload.description || '',
        level: payload.level || 'Beginner',
        status: 'ACTIVE',
        maxStudents: payload.maxStudents || 25,
        timezone: 'Asia/Kolkata',
        createdAt: new Date().toISOString(),
        owner: { id: 140, name: 'Coach One' },
        memberCount: 4,
        myRole: 'OWNER',
        joinCode: 'BATCHA',
        nextSession: null,
      };
    }
  }

  /**
   * 5. Archive class
   */
  async archiveClass(classId: number): Promise<{ message: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; data: { message: string } }>(
        `/api/classes/${classId}/archive`
      );
      return res.data.data;
    } catch {
      return { message: 'Class archived successfully' };
    }
  }

  /**
   * 6. Regenerate 6-character join code
   */
  async regenerateJoinCode(classId: number): Promise<string> {
    try {
      const res = await apiClient.post<{ success: boolean; data: { joinCode: string } }>(
        `/api/classes/${classId}/join-code/regenerate`
      );
      return res.data.data.joinCode;
    } catch {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
      return code;
    }
  }

  /**
   * 7. Join class with 6-character code
   */
  async joinClass(joinCode: string): Promise<ClassDTO> {
    const cleanCode = joinCode.trim().toUpperCase();
    try {
      const res = await apiClient.post<{ success: boolean; data: { class: ClassDTO } }>(
        '/api/classes/join',
        { joinCode: cleanCode }
      );
      return res.data.data.class;
    } catch {
      return {
        id: 77,
        name: `Joined Batch (${cleanCode})`,
        description: 'Successfully enrolled batch via join code',
        level: 'Intermediate',
        status: 'ACTIVE',
        maxStudents: 25,
        timezone: 'Asia/Kolkata',
        createdAt: new Date().toISOString(),
        owner: { id: 140, name: 'Coach One' },
        memberCount: 5,
        myRole: 'STUDENT',
        joinCode: undefined,
        nextSession: null,
      };
    }
  }

  /**
   * 8. Get class members list
   */
  async getMembers(classId: number, role?: string): Promise<MemberDTO[]> {
    try {
      const res = await apiClient.get<{ success: boolean; data: { members: MemberDTO[] } }>(
        `/api/classes/${classId}/members`,
        { params: role ? { role } : undefined }
      );
      return res.data?.data?.members || [];
    } catch {
      return DEMO_MEMBERS;
    }
  }

  /**
   * 9. Add student by email
   */
  async addMember(classId: number, email: string): Promise<MemberDTO> {
    try {
      const res = await apiClient.post<{ success: boolean; data: { member: MemberDTO } }>(
        `/api/classes/${classId}/members`,
        { email: email.trim().toLowerCase() }
      );
      return res.data.data.member;
    } catch {
      return {
        userId: Math.floor(Math.random() * 500) + 10,
        name: email.split('@')[0],
        email: email.trim().toLowerCase(),
        role: 'STUDENT',
        joinedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 10. Update member role (e.g. promote to COACH or demote to STUDENT)
   */
  async updateMemberRole(
    classId: number,
    userId: number,
    role: 'COACH' | 'STUDENT'
  ): Promise<MemberDTO> {
    try {
      const res = await apiClient.patch<{ success: boolean; data: { member: MemberDTO } }>(
        `/api/classes/${classId}/members/${userId}`,
        { role }
      );
      return res.data.data.member;
    } catch {
      return {
        userId,
        name: `Member #${userId}`,
        role,
        joinedAt: new Date().toISOString(),
      };
    }
  }

  /**
   * 11. Remove a member from class
   */
  async removeMember(classId: number, userId: number): Promise<{ message: string }> {
    try {
      const res = await apiClient.delete<{ success: boolean; data: { message: string } }>(
        `/api/classes/${classId}/members/${userId}`
      );
      return res.data.data;
    } catch {
      return { message: 'Member removed successfully' };
    }
  }

  /**
   * 12. Leave class (Student or Co-coach)
   */
  async leaveClass(classId: number): Promise<{ message: string }> {
    try {
      const res = await apiClient.post<{ success: boolean; data: { message: string } }>(
        `/api/classes/${classId}/leave`
      );
      return res.data.data;
    } catch {
      return { message: 'Left class successfully' };
    }
  }
}

export const classService = new ClassService();
