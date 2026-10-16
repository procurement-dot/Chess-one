export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  coachHint: string;
  explanation: string;
}

export interface LevelData {
  id: number;
  worldId: number;
  worldTitle: string;
  category: 'Foundation' | 'Developing' | 'Advanced';
  title: string;
  pieceSymbol: string;
  eyebrow: string;
  ruleTitle: string;
  ruleDescription: string;
  xpReward: number;
  initialFen?: string;
  quiz: QuizData;
}

/**
 * ============================================================================
 * CHESSONE LEARN LEVELS DATA
 * ============================================================================
 * When real curriculum data is available, simply edit or replace the array below.
 * The UI dynamically adapts to any number of levels, worlds, and quiz options.
 * ============================================================================
 */
export const LEARN_LEVELS: LevelData[] = [
  {
    id: 1,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: 'The Chess Board',
    pieceSymbol: '▦',
    eyebrow: 'FOUNDATION · STEP 1 · +20 XP',
    ruleTitle: 'Board Setup & Square Colors',
    ruleDescription:
      'The chessboard has 64 squares in an 8x8 grid: 32 light and 32 dark. Remember the golden rule: "White on right!" — the bottom-right corner square must always be light/white.',
    xpReward: 20,
    quiz: {
      question: 'Which square must be on the bottom-right corner for each player?',
      options: [
        'A dark square',
        'A light (white) square',
        'Any square, it does not matter',
      ],
      correctIndex: 1,
      coachHint: 'Remember the classic rhyme: "White on the right!"',
      explanation: 'Always set up the board so that a light square is on the bottom right corner (h1 for White, a8 for Black).',
    },
  },
  {
    id: 2,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: 'The Pawn',
    pieceSymbol: '♙',
    eyebrow: 'FOUNDATION · STEP 2 · +20 XP',
    ruleTitle: 'Forward March, Diagonal Strike',
    ruleDescription:
      'Pawns move forward one square, but on their very first move, they may jump two squares! Pawns capture diagonally forward one square, never straight ahead.',
    xpReward: 20,
    quiz: {
      question: 'How does a pawn capture an enemy piece?',
      options: [
        'Straight forward one square',
        'One square diagonally forward',
        'Backwards diagonally',
      ],
      correctIndex: 1,
      coachHint: 'Pawns walk forward, but fight diagonally!',
      explanation: 'Pawns march straight, but capture one square diagonally forward.',
    },
  },
  {
    id: 3,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: 'The Rook',
    pieceSymbol: '♖',
    eyebrow: 'FOUNDATION · STEP 3 · +20 XP',
    ruleTitle: 'The Heavy Artillery',
    ruleDescription:
      'The rook is a major piece worth 5 points. It moves in straight lines along files (up and down) and ranks (left and right) for as many open squares as it wants.',
    xpReward: 20,
    quiz: {
      question: 'In which directions can the Rook move?',
      options: [
        'Diagonally only',
        'Horizontally and vertically along straight lines',
        'In an L-shape like a horse',
      ],
      correctIndex: 1,
      coachHint: 'Think of a plus sign (+). Rooks glide across ranks and files!',
      explanation: 'Rooks move in straight horizontal and vertical lines across the entire board.',
    },
  },
  {
    id: 4,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: "The Knight's Move",
    pieceSymbol: '♘',
    eyebrow: 'FOUNDATION · STEP 4 · +20 XP',
    ruleTitle: 'The Tricky Jumper',
    ruleDescription:
      'The knight moves in an "L" shape: two squares in one direction and then one square at a right angle. The knight is the ONLY piece on the board that can leap over other pieces!',
    xpReward: 20,
    quiz: {
      question: 'Which piece is the only one allowed to jump over other pieces?',
      options: [
        'The Bishop',
        'The Knight',
        'The Rook',
      ],
      correctIndex: 1,
      coachHint: 'Think of horses jumping hurdles on a track!',
      explanation: 'The Knight is the only piece that can hop over friendly or enemy pieces.',
    },
  },
  {
    id: 5,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: 'The Bishop',
    pieceSymbol: '♗',
    eyebrow: 'FOUNDATION · STEP 5 · +20 XP',
    ruleTitle: 'The Diagonal Sniper',
    ruleDescription:
      'Each player starts with two bishops: one on light squares and one on dark squares. A bishop moves diagonally as many squares as it wants, but it NEVER leaves its starting color!',
    xpReward: 20,
    quiz: {
      question: 'Can a light-squared bishop ever move to a dark square?',
      options: [
        'Yes, after capturing a piece',
        'No, it must always stay on light squares',
        'Yes, if it moves backwards',
      ],
      correctIndex: 1,
      coachHint: 'Bishops are loyal to their original square color for the entire game!',
      explanation: 'Because bishops only move diagonally, they can never change square colors.',
    },
  },
  {
    id: 6,
    worldId: 1,
    worldTitle: 'Piece Explorers',
    category: 'Foundation',
    title: 'The Queen',
    pieceSymbol: '♕',
    eyebrow: 'FOUNDATION · STEP 6 · +25 XP',
    ruleTitle: 'The Most Powerful Piece',
    ruleDescription:
      'The Queen combines the powers of the Rook and Bishop! She can move horizontally, vertically, or diagonally as many open squares as she wishes. Worth 9 points!',
    xpReward: 25,
    quiz: {
      question: 'Which two piece movements does the Queen combine?',
      options: [
        'Rook and Bishop',
        'Knight and Pawn',
        'King and Rook',
      ],
      correctIndex: 0,
      coachHint: 'The Queen can slide straight like a tower AND slice diagonally like a bishop.',
      explanation: 'The Queen can move straight in any direction (ranks, files, and diagonals) as long as the path is unblocked.',
    },
  },
];

export function getLevelById(id: number): LevelData | undefined {
  return LEARN_LEVELS.find((l) => l.id === id);
}

export function getNextLevelId(currentId: number): number | null {
  const next = LEARN_LEVELS.find((l) => l.id === currentId + 1);
  return next ? next.id : null;
}
