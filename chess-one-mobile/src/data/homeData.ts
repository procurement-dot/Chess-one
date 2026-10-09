export const SAMPLE_STUDENT_STATS = {
  xp: 240,
  level: 4,
  learningRating: 640,
  lessonsFinished: 8,
  totalLessons: 24,
  practiceMinutesThisWeek: 48,
};

export const SAMPLE_TASKS = [
  { id: '1', title: "Level 4: The knight's move", type: 'level' },
  { id: '2', title: 'Practise with Coach One', type: 'practice' },
  { id: '3', title: 'Review a game moment', type: 'review' },
];

export const SAMPLE_PARENT_DATA = {
  childName: 'Aarav',
  weeklyPractice: 48,
  schoolTasksCompleted: 2,
  schoolTasksTotal: 3,
  learningRating: 640,
  recentTopic: "The knight's move",
  prompt: 'Can you show me how the knight jumps over other pieces?',
  pendingApprovals: [
    { id: '1', title: 'KinderSports School Chess Cup', type: 'Tournament Entry' },
  ],
};

export const SAMPLE_COACH_DATA = {
  nextClass: { time: '16:00 IST', title: 'Beginner Batch A', students: 8 },
  celebrations: ['Neha hit 1000 rating', 'Raj finished World 1'],
};

export const SAMPLE_SCHOOL_DATA = {
  assignedLessons: 12,
  completedLessons: 8,
  skills: [
    { name: 'Piece movement', progress: 86 },
    { name: 'Board awareness', progress: 68 },
    { name: 'King safety', progress: 54 },
  ],
};

export const SAMPLE_ORGANISER_CHECKLIST = [
  { id: 'c1', label: 'Venue setup confirmed', done: true },
  { id: 'c2', label: 'Clocks synced', done: false },
  { id: 'c3', label: 'Pairings published', done: false },
];

export const SAMPLE_ORGANISER_BOARDS = [
  { id: 'b1', board: 1, white: 'Aarav M.', black: 'Kabir S.', result: null },
  { id: 'b2', board: 2, white: 'Neha P.', black: 'Diya R.', result: '1-0' },
];
