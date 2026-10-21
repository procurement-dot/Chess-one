export interface BadgeItem {
  id: string;
  title: string;
  description: string;
  icon: 'award' | 'zap' | 'shield' | 'star' | 'check-circle';
  bgColor: string;
  checkUnlocked: (params: {
    completedCount: number;
    coachPracticed: boolean;
    gameReviewed: boolean;
    totalStars: number;
    puzzlesSolvedCount?: number;
  }) => boolean;
}

/**
 * ============================================================================
 * CHESSONE BADGE SHELF DATA
 * ============================================================================
 * Easily edit or add student achievements here.
 * ============================================================================
 */
export const BADGES_DATA: BadgeItem[] = [
  {
    id: 'first_move',
    title: 'First move',
    description: 'Complete your very first lesson on ChessOne.',
    icon: 'award',
    bgColor: '#FBA586', // accentPeach
    checkUnlocked: ({ completedCount }) => completedCount >= 1,
  },
  {
    id: 'curious_mind',
    title: 'Curious mind',
    description: 'Play a live practice match with Coach One.',
    icon: 'zap',
    bgColor: '#6E9A5B', // greenAccent
    checkUnlocked: ({ coachPracticed }) => coachPracticed,
  },
  {
    id: 'tactics_wizard',
    title: 'Tactics Wizard',
    description: 'Solve your first chess tactic puzzle.',
    icon: 'zap',
    bgColor: '#F59E0B', // amber
    checkUnlocked: ({ puzzlesSolvedCount }) => (puzzlesSolvedCount || 0) >= 1,
  },
  {
    id: 'piece_explorer',
    title: 'Piece explorer',
    description: 'Master all 6 basic piece movement lessons.',
    icon: 'shield',
    bgColor: '#3B82F6', // blueAccent
    checkUnlocked: ({ completedCount }) => completedCount >= 6,
  },
  {
    id: 'opening_analyst',
    title: 'Game analyst',
    description: 'Step through an annotated master opening game.',
    icon: 'star',
    bgColor: '#EAB308', // yellow
    checkUnlocked: ({ gameReviewed }) => gameReviewed,
  },
];
