/**
 * Class Module - Core Types and Backend Contract
 */

export type UserRole = 'PLAYER' | 'COACH' | 'ADMIN';
export type ClassRole = 'OWNER' | 'COACH' | 'STUDENT';
export type ClassStatus = 'ACTIVE' | 'ARCHIVED';
export type MemberStatus = 'ACTIVE' | 'REMOVED' | 'LEFT';
export type SessionStatus = 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
export type PositionType = 'DEMO' | 'PUZZLE';
export type SubmissionStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export type ClassErrorCode =
  | 'CLASS_NOT_FOUND'
  | 'SESSION_NOT_FOUND'
  | 'LESSON_NOT_FOUND'
  | 'ASSIGNMENT_NOT_FOUND'
  | 'NOT_A_CLASS_MEMBER'
  | 'NOT_CLASS_COACH'
  | 'COACH_ROLE_REQUIRED'
  | 'ALREADY_MEMBER'
  | 'CLASS_FULL'
  | 'SESSION_ALREADY_LIVE'
  | 'ALREADY_SUBMITTED'
  | 'CLASS_ARCHIVED'
  | 'SESSION_NOT_LIVE'
  | 'INVALID_FEN'
  | 'INVALID_SOLUTION'
  | 'ASSIGNMENT_PAST_DUE'
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'TOKEN_EXPIRED';

export interface ApiSuccess<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: ClassErrorCode | string;
    message: string;
    details?: { field?: string; message?: string }[] | any;
  };
}

export interface ClassItem {
  id: number;
  name: string;
  description?: string | null;
  level?: string | null;
  joinCode: string;
  ownerId: number;
  owner?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
  status: ClassStatus;
  maxStudents?: number | null;
  timezone: string;
  createdAt: string;
  updatedAt: string;
  membersCount?: number;
}

export interface ClassMember {
  id: number;
  classId: number;
  userId: number;
  role: ClassRole;
  status: MemberStatus;
  joinedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
    rating?: number;
  };
}

export interface ClassSession {
  id: number;
  classId: number;
  title: string;
  description?: string | null;
  startsAt: string;
  durationMin: number;
  status: SessionStatus;
  meetingUrl?: string | null;
  liveFen?: string | null;
  livePgn?: string | null;
  startedAt?: string | null;
  endedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: number;
  sessionId: number;
  userId: number;
  status: AttendanceStatus;
  joinedLiveAt?: string | null;
  markedById?: number | null;
  note?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface Lesson {
  id: number;
  classId: number;
  title: string;
  content?: string | null;
  orderIndex: number;
  isPublished: boolean;
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  positionsCount?: number;
}

export interface LessonPosition {
  id: number;
  lessonId: number;
  fen: string;
  type: PositionType;
  title?: string | null;
  solution?: string[];
  hint?: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface Assignment {
  id: number;
  classId: number;
  lessonId?: number | null;
  title: string;
  instructions?: string | null;
  dueAt?: string | null;
  maxScore: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AssignmentItem {
  id: number;
  assignmentId: number;
  positionId: number;
  orderIndex: number;
  position?: LessonPosition;
}

export interface Submission {
  id: number;
  assignmentId: number;
  studentId: number;
  status: SubmissionStatus;
  score?: number | null;
  feedback?: string | null;
  submittedAt?: string | null;
  gradedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    name: string;
    email: string;
    avatarUrl?: string | null;
  };
}

export interface PuzzleAttemptResult {
  isCorrect: boolean;
  correctUpTo?: number;
  hint?: string;
  timeTakenMs?: number;
}

export interface LiveSessionState {
  sessionId: number;
  classId: number;
  status: SessionStatus;
  liveFen?: string | null;
  livePgn?: string | null;
  activeCoachId?: number | null;
  attendeesCount?: number;
}

export interface ClassChatMessage {
  id: number;
  sessionId: number;
  userId: number;
  userName: string;
  userRole: ClassRole;
  text: string;
  createdAt: string;
}

export interface StudentProgress {
  userId: number;
  classId: number;
  attendedSessions: number;
  totalSessions: number;
  attendanceRate: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore?: number;
}

export interface ClassDTO {
  id: number;
  name: string;
  description?: string | null;
  level?: string | null;
  status: ClassStatus;
  maxStudents?: number | null;
  timezone: string;
  createdAt: string;
  owner?: {
    id: number;
    name: string;
    avatarUrl?: string | null;
  } | null;
  memberCount: number;
  myRole?: ClassRole | 'ADMIN' | null;
  joinCode?: string;
  nextSession?: any | null;
}

export interface MemberDTO {
  userId: number;
  name: string;
  avatarUrl?: string | null;
  role: ClassRole;
  joinedAt: string;
  email?: string;
}

export interface CreateClassPayload {
  name: string;
  description?: string | null;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  maxStudents?: number;
  timezone?: string;
}

export interface UpdateClassPayload {
  name?: string;
  description?: string | null;
  level?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  maxStudents?: number;
  timezone?: string;
}
