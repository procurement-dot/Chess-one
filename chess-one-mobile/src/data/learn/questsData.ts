export interface QuestItem {
  id: string;
  title: string;
  subtitle: string;
  target: number;
  xpReward: number;
}

/**
 * ============================================================================
 * CHESSONE WEEKLY QUESTS DATA
 * ============================================================================
 * Easily edit or add weekly objectives here.
 * ============================================================================
 */
export const WEEKLY_QUESTS: QuestItem[] = [
  {
    id: 'q1',
    title: 'Complete a new level',
    subtitle: 'Foundation pathway',
    target: 1,
    xpReward: 50,
  },
  {
    id: 'q2',
    title: 'Practise with your coach',
    subtitle: 'Guided board match with Coach One',
    target: 1,
    xpReward: 50,
  },
  {
    id: 'q3',
    title: 'Review a historic game',
    subtitle: 'Learn by Game / Opening Review',
    target: 1,
    xpReward: 75,
  },
];
