/**
 * School and Prototype Demo Mock Data
 * Reference: https://chessone-school.nikhilladdha.chatgpt.site/
 * Standalone mock data for UI additions without backend modifications.
 */

export interface StudentProgressReportData {
  studentName: string;
  grade: string;
  school: string;
  headline: string;
  summary: string;
  lessonsFinished: number;
  totalLessons: number;
  weeklyPracticeMinutes: number;
  practiceGoalMinutes: number;
  placementGamesFinished: number;
  placementGamesTotal: number;
  whatIsImproving: { title: string; detail: string }[];
  whatNeedsPractice: string;
  nextGoal: string;
  questionToThinkAbout: string;
  schoolTasksFinished: number;
  schoolTasksTotal: number;
  coachName: string;
  pathway: string;
  learningRating: number;
  ratingDelta: number;
  fideNotice: string;
  permissions: {
    eventTitle: string;
    eventDate: string;
    eventAge: string;
    eventFee: number;
    weeklySummary: boolean;
    friendInvites: boolean;
  };
  skillsMastery: { name: string; progress: number }[];
}

export const DEMO_STUDENT_REPORT: StudentProgressReportData = {
  studentName: 'Aarav',
  grade: 'Grade 5 · Section A',
  school: 'Greenwood School',
  headline: 'Learning to think before moving.',
  summary: 'Aarav is practising how pieces move, how to use the centre and how to check for threats.',
  lessonsFinished: 8,
  totalLessons: 24,
  weeklyPracticeMinutes: 48,
  practiceGoalMinutes: 60,
  placementGamesFinished: 0,
  placementGamesTotal: 5,
  whatIsImproving: [
    { title: 'Piece movement', detail: 'growing confidence.' },
    { title: 'Centre control', detail: 'beginning to connect moves with a plan.' },
  ],
  whatNeedsPractice: 'Before moving, check whether the destination is attacked and whether another piece is left unprotected.',
  nextGoal: 'Complete the knight challenge, practise one short game and explain one move in your own words.',
  questionToThinkAbout: 'What did your opponent threaten, and how did you respond?',
  schoolTasksFinished: 2,
  schoolTasksTotal: 3,
  coachName: 'Meera Shah',
  pathway: 'Foundation pathway',
  learningRating: 640,
  ratingDelta: 32,
  fideNotice: 'ChessOne learning rating: 640 (sample). FIDE ratings are recorded separately and do not change because of this report.',
  permissions: {
    eventTitle: 'School Chess Cup',
    eventDate: '18 October',
    eventAge: 'U-12',
    eventFee: 250,
    weeklySummary: true,
    friendInvites: true,
  },
  skillsMastery: [
    { name: 'Piece movement', progress: 86 },
    { name: 'Centre control', progress: 72 },
    { name: 'Piece safety', progress: 58 },
    { name: 'Planning ahead', progress: 40 },
  ],
};

export const DEMO_DAILY_MOVES = [
  {
    id: 'm1',
    icon: '♙',
    title: 'Learn how the knight moves',
    subtitle: '6 min · School assignment',
    done: false,
    duration: '6 min',
    actionRoute: '/learn',
  },
  {
    id: 'm2',
    icon: '♞',
    title: 'Play with Coach One',
    subtitle: '10 min · Guided practice',
    done: false,
    duration: '10 min',
    actionRoute: '/play',
  },
  {
    id: 'm3',
    icon: '✓',
    title: 'Solve 3 opening puzzles',
    subtitle: 'Completed · +15 learning points',
    done: true,
    actionRoute: '/learn',
  },
];

export const DEMO_COACH_ONE_TIP = {
  quote: '“Your knight can jump over pieces. Let’s see where it can go next.”',
  todaysFocus: {
    title: 'Look. Think. Move.',
    description: 'Check what your opponent is threatening before choosing your move.',
  },
};

export const DEMO_CALENDAR_EVENTS = [
  {
    id: 'e1',
    month: 'OCT',
    day: '18',
    title: 'School Chess Cup',
    category: 'U-12 · Online · 10 + 5 rapid',
    fee: 250,
    rounds: '5-round Swiss',
    type: 'Online',
  },
  {
    id: 'e2',
    month: 'OCT',
    day: '12',
    title: 'Think like a chess detective',
    category: 'Beginner workshop · Sample event',
    time: '4:00 PM IST',
    type: 'Workshop',
  },
];

export const DEMO_COACH_DATA = {
  level: 'Level 3 / 5',
  points: '1,240 pts',
  learnersCount: 20,
  nextClass: { time: '16:00 IST', title: 'Beginner Batch A', students: 8 },
  batches: [
    {
      id: 'b1',
      title: 'Junior Knights (Grade 4–6)',
      time: 'Tue & Thu 5:00 PM',
      enrolled: 8,
      capacity: 12,
    },
    {
      id: 'b2',
      title: 'Tactics that win games',
      time: 'Mon & Wed 6:00 PM',
      enrolled: 10,
      capacity: 12,
    },
  ],
  celebrations: [
    'Neha P. hit 1000 rating milestone!',
    'Raj finished World 1 Piece Explorers!',
  ],
  students: [
    { name: 'Aarav M.', batch: 'Junior Knights', rating: 640, status: 'Active' },
    { name: 'Riya S.', batch: 'Junior Knights', rating: 820, status: 'Active' },
    { name: 'Kabir M.', batch: 'Junior Knights', rating: 610, status: 'Needs support' },
  ],
};

export const DEMO_SCHOOL_DATA = {
  enrolled: 120,
  weeklyCompletion: 78,
  needSupport: 12,
  schedule: {
    title: 'Compulsory chess · 2 sessions a week',
    days: 'Tuesday classroom practice, Friday online lesson',
  },
  assignments: [
    { title: 'The knight’s move', class: 'Grade 5 A', due: 'Due Friday', progress: '24 / 30' },
    { title: 'King safety', class: 'Grade 5 B', due: 'Due Monday', progress: '18 / 30' },
  ],
  skillsSnapshot: [
    { name: 'Piece movement', progress: 86 },
    { name: 'Board awareness', progress: 68 },
    { name: 'King safety', progress: 54 },
  ],
  studentsRoster: [
    { name: 'Aarav', path: 'Foundation', status: 'Needs practice' },
    { name: 'Riya S.', path: 'Developing', status: 'Completed' },
    { name: 'Kabir M.', path: 'Foundation', status: 'Not started' },
    { name: 'Ananya P.', path: 'Developing', status: 'Completed' },
  ],
};

export const DEMO_ORGANIZER_DATA = {
  sampleEntries: 64,
  paymentsReconciled: '60 / 64',
  setupReadiness: 30,
  checklist: [
    { id: 0, label: 'Confirm age groups, eligibility and format', done: true },
    { id: 1, label: 'Set time control, rounds and tie-breaks', done: true },
    { id: 2, label: 'Publish rules, refund policy and parent consent', done: true },
    { id: 3, label: 'Appoint chief arbiter and deputy arbiters', done: false },
    { id: 4, label: 'Check payment reconciliation and entry list', done: false },
    { id: 5, label: 'Test online rooms, reconnect policy and support', done: false },
    { id: 6, label: 'Prepare venue, boards, clocks and accessibility', done: false },
    { id: 7, label: 'Schedule check-in, pairings and rest breaks', done: false },
    { id: 8, label: 'Record results, resolve appeals and review fair play', done: false },
    { id: 9, label: 'Publish standings, certificates and parent summary', done: false },
  ],
  boards: [
    { board: '01', white: 'Riya S.', black: 'Kabir M.', result: null },
    { board: '02', white: 'Ananya P.', black: 'Aarav', result: null },
    { board: '03', white: 'Ishaan R.', black: 'Meera K.', result: '1–0' },
  ],
};

export const DEMO_FAQS = [
  {
    q: 'How do I see my progress report?',
    a: 'Open Profile and select Progress report, or tap "Open my progress report" at the top of the Home screen. It shows your skill mastery, weekly practice time and school assignments.',
  },
  {
    q: 'How does Coach One help?',
    a: 'Coach One gives friendly, contextual tips after moves and helps you think about candidate squares, piece safety and center control.',
  },
  {
    q: 'Where can I analyse a game?',
    a: 'Open the Analysis tab to view game review, replay moves, examine candidate options, and export or import PGNs.',
  },
  {
    q: 'How do courses, classes and tournaments work?',
    a: 'Browse live batches in Classes and school tournaments in Tournaments. The registration and checkout flows in this build are interactive previews.',
  },
  {
    q: 'How do I invite a classmate?',
    a: 'Open the Community tab, select a friend from your school circle, and send an invitation or join game rooms using your room code.',
  },
  {
    q: 'What are the 4 user roles in ChessOne?',
    a: 'Student (daily learning, games, XP), Coach (batches, celebrations), School (class assignments, progress rosters), and Organizer (tournaments, round management).',
  },
];
