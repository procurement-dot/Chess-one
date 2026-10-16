export interface AnnotatedMove {
  pgn: string;
  san: string;
  note: string;
  principle: string;
}

export interface GameReviewItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  moves: AnnotatedMove[];
}

export const GAME_REVIEWS: GameReviewItem[] = [
  {
    id: 'italian-game',
    title: 'The Italian Game',
    subtitle: 'Classic Open Game (Giuoco Piano)',
    description: "Learn how White and Black fight for central dominance and piece activity from move one.",
    moves: [
      {
        pgn: '1. e4',
        san: 'e4',
        note: 'Controlling central squares (d5, f5) and unlocking diagonals for Queen and Bishop.',
        principle: 'Center Control',
      },
      {
        pgn: '1... e5',
        san: 'e5',
        note: 'Black meets White in the center, staking equal claim to the crucial squares.',
        principle: 'Symmetry & Contention',
      },
      {
        pgn: '2. Nf3',
        san: 'Nf3',
        note: 'Developing the knight to its ideal post while directly attacking Black\'s e5 pawn.',
        principle: 'Develop with a Threat',
      },
      {
        pgn: '2... Nc6',
        san: 'Nc6',
        note: 'Black develops a minor piece while actively guarding the e5 pawn.',
        principle: 'Development & Defense',
      },
      {
        pgn: '3. Bc4',
        san: 'Bc4',
        note: 'The defining move of the Italian Game! The bishop aims directly at f7, the weakest square in Black\'s camp.',
        principle: 'Targeting Weaknesses',
      },
      {
        pgn: '3... Bc5',
        san: 'Bc5',
        note: 'Black develops their dark-squared bishop, mirroring White\'s active layout.',
        principle: 'Active Piece Placement',
      },
    ],
  },
];
