export interface CommunityClassmate {
  id: string;
  name: string;
  grade: string;
  skillLevel: 'Foundation' | 'Developing' | 'Advanced';
  isOnline: boolean;
  avatarColor: string;
}

export interface CommunityClub {
  id: string;
  name: string;
  category: string;
  ageGroup: string;
  isJoined: boolean;
  moderator: string;
  membersCount: number;
}

export const SAMPLE_CLASSMATES: CommunityClassmate[] = [
  {
    id: 'c-1',
    name: 'Riya S.',
    grade: 'Grade 5',
    skillLevel: 'Developing',
    isOnline: true,
    avatarColor: '#FBA586',
  },
  {
    id: 'c-2',
    name: 'Kabir M.',
    grade: 'Grade 5',
    skillLevel: 'Foundation',
    isOnline: true,
    avatarColor: '#6E9A5B',
  },
  {
    id: 'c-3',
    name: 'Ananya P.',
    grade: 'Grade 5',
    skillLevel: 'Foundation',
    isOnline: false,
    avatarColor: '#3B82F6',
  },
  {
    id: 'c-4',
    name: 'Arnav K.',
    grade: 'Grade 5',
    skillLevel: 'Developing',
    isOnline: false,
    avatarColor: '#EAB308',
  },
];

export const SAMPLE_CLUBS: CommunityClub[] = [
  {
    id: 'club-1',
    name: 'Greenwood Chess Circle',
    category: 'Your school · Teacher moderated',
    ageGroup: 'Grade 3–8',
    isJoined: true,
    moderator: 'Ms. Shah (Teacher)',
    membersCount: 120,
  },
  {
    id: 'club-2',
    name: 'Pune Junior Knights',
    category: 'Verified junior club · Supervised play',
    ageGroup: 'Ages 8–12',
    isJoined: false,
    moderator: 'KinderSports Certified',
    membersCount: 85,
  },
  {
    id: 'club-3',
    name: 'Weekend Chess Lab',
    category: 'Coach-led study club · Foundation',
    ageGroup: 'Ages 7–14',
    isJoined: false,
    moderator: 'Coach Arjun',
    membersCount: 64,
  },
];

export const PRESET_MESSAGES = [
  'Great work! 👏',
  'Let’s practise! ♟️',
  'Good game! 🤝',
  'Can our teacher explain this? 🙋‍♂️',
];

export const REPORT_REASONS = [
  'Unkind behaviour',
  'Inappropriate message',
  'Unwanted contact',
  'Fair-play concern',
];
