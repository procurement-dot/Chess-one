export interface PuzzleChoice {
  san: string;
  label: string;
  isCorrect: boolean;
  coachFeedback: string;
}

export interface PuzzleItem {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  theme: 'Mate in 1' | 'Knight Fork' | 'Absolute Pin' | 'Back Rank Mate' | 'Battery Mate' | 'Arabian Mate' | 'Epaulette Mate' | 'Deflection';
  rating: number;
  fen: string;
  turn: 'w' | 'b';
  solutionSan: string;
  coachHint: string;
  explanation: string;
  xpReward: number;
  choices: PuzzleChoice[];
}

/**
 * ============================================================================
 * 10 VERIFIED CHESS PUZZLES
 * ============================================================================
 * All 10 puzzles have been verified with chess.js for legal moves, FEN accuracy,
 * and checkmate/tactical precision.
 * ============================================================================
 */
export const CHESS_PUZZLES: PuzzleItem[] = [
  {
    id: 'puz-01',
    number: 1,
    title: 'The Scholar\'s Knockout',
    subtitle: 'White to move · Deliver checkmate in 1 move',
    theme: 'Mate in 1',
    rating: 600,
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 0 4',
    turn: 'w',
    solutionSan: 'Qxf7#',
    coachHint: 'Both White\'s Queen on h5 and Bishop on c4 are eyeing the weak f7 square right next to Black\'s King!',
    explanation: '1. Qxf7# is the famous Scholar\'s Mate! The Queen captures on f7 defended by the Bishop on c4. The Black King is trapped with zero escape squares.',
    xpReward: 30,
    choices: [
      {
        san: 'Qxf7#',
        label: '1. Qxf7# (Queen captures f7 Checkmate!)',
        isCorrect: true,
        coachFeedback: '💥 BOOM! Checkmate! Queen delivered the final blow with Bishop backup!',
      },
      {
        san: 'Nf3',
        label: '1. Nf3 (Develop Knight)',
        isCorrect: false,
        coachFeedback: '1. Nf3 develops a piece, but it misses the instant knockout on f7!',
      },
      {
        san: 'Qf3',
        label: '1. Qf3 (Queen retreat)',
        isCorrect: false,
        coachFeedback: 'Why retreat your queen when Black\'s king is wide open on f7?',
      },
    ],
  },
  {
    id: 'puz-02',
    number: 2,
    title: 'Corridor of Doom',
    subtitle: 'White to move · Exploit the trapped king',
    theme: 'Back Rank Mate',
    rating: 700,
    fen: '6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1',
    turn: 'w',
    solutionSan: 'Ra8#',
    coachHint: 'Black\'s King has no escape ("luft") because of the pawns on f7, g7, and h7. Attack the 8th rank!',
    explanation: '1. Ra8# is a classic Back Rank Checkmate! Black\'s own pawns prevent the King from stepping forward, creating a deadly corridor on rank 8.',
    xpReward: 30,
    choices: [
      {
        san: 'Ra8#',
        label: '1. Ra8# (Rook strikes the 8th rank!)',
        isCorrect: true,
        coachFeedback: '🎯 Masterclass! The back rank corridor claims another king!',
      },
      {
        san: 'h3',
        label: '1. h3 (Make luft for White\'s king)',
        isCorrect: false,
        coachFeedback: 'Making luft is cautious, but you have an instant checkmate with Ra8#!',
      },
      {
        san: 'Re1',
        label: '1. Re1 (Control e-file)',
        isCorrect: false,
        coachFeedback: 'Re1 is passive! Strike straight to the 8th rank with Ra8#!',
      },
    ],
  },
  {
    id: 'puz-03',
    number: 3,
    title: 'The Royal Knight Fork',
    subtitle: 'White to move · Win decisive material',
    theme: 'Knight Fork',
    rating: 850,
    fen: 'r3k3/ppp2ppp/8/3N4/8/8/PPP2PPP/R4RK1 w q - 0 1',
    turn: 'w',
    solutionSan: 'Nxc7+',
    coachHint: 'Knights excel at attacking two pieces at once. Look for an unprotected square where the Knight can check the King AND attack the Rook on a8!',
    explanation: '1. Nxc7+ checks the Black King on e8 while simultaneously attacking the unprotected Rook on a8. After the King moves, White captures the Rook (Nxa8)!',
    xpReward: 35,
    choices: [
      {
        san: 'Nxc7+',
        label: '1. Nxc7+ (Fork King and Rook!)',
        isCorrect: true,
        coachFeedback: '🍴 Royal Fork! The Knight leaps to c7, checking the king and winning the rook!',
      },
      {
        san: 'Nf4',
        label: '1. Nf4 (Retreat Knight)',
        isCorrect: false,
        coachFeedback: 'Don\'t retreat when c7 is sitting right there begging for a fork!',
      },
      {
        san: 'Rfe1+',
        label: '1. Rfe1+ (Central Rook check)',
        isCorrect: false,
        coachFeedback: 'Rfe1+ is a check, but Black can block with Be7. Nxc7+ wins a full rook!',
      },
    ],
  },
  {
    id: 'puz-04',
    number: 4,
    title: 'Heavy Artillery Strike',
    subtitle: 'White to move · Deliver checkmate along the file',
    theme: 'Back Rank Mate',
    rating: 750,
    fen: '6k1/5ppp/8/8/8/8/1Q3PPP/4R1K1 w - - 0 1',
    turn: 'w',
    solutionSan: 'Re8#',
    coachHint: 'White has a Queen and Rook battery. Drop the hammer on the back rank!',
    explanation: '1. Re8# checkmates the King. Even if Black had a piece on the back rank, Queen and Rook coordinate to overwhelm any defense.',
    xpReward: 30,
    choices: [
      {
        san: 'Re8#',
        label: '1. Re8# (Rook checkmate on the 8th rank!)',
        isCorrect: true,
        coachFeedback: '⚡ Splendid! Heavy artillery strikes down the board!',
      },
      {
        san: 'Qb8',
        label: '1. Qb8 (Queen to back rank)',
        isCorrect: false,
        coachFeedback: 'Qb8 is also strong, but Re8# is the most direct and forceful checkmate!',
      },
      {
        san: 'Qe2',
        label: '1. Qe2 (Align on e-file)',
        isCorrect: false,
        coachFeedback: 'No need to prepare when Re8# ends the game on the spot!',
      },
    ],
  },
  {
    id: 'puz-05',
    number: 5,
    title: 'Frozen in Place',
    subtitle: 'White to move · Exploit the absolute pin',
    theme: 'Absolute Pin',
    rating: 800,
    fen: '6k1/5qpp/8/8/2B5/8/5PPP/4K3 w - - 0 1',
    turn: 'w',
    solutionSan: 'Bxf7+',
    coachHint: 'The Black Queen on f7 cannot escape because behind her stands the King on g8. Win the Queen!',
    explanation: '1. Bxf7+ captures Black\'s Queen with check! Because of the absolute pin along the a2-g8 diagonal, Black\'s Queen was paralyzed and helpless.',
    xpReward: 35,
    choices: [
      {
        san: 'Bxf7+',
        label: '1. Bxf7+ (Capture the pinned Queen!)',
        isCorrect: true,
        coachFeedback: '🎯 Nailed it! The pinned queen could not escape the sniper bishop!',
      },
      {
        san: 'Ke2',
        label: '1. Ke2 (Activate King)',
        isCorrect: false,
        coachFeedback: 'If you wait, Black will move their King and unpin the queen! Strike now with Bxf7+!',
      },
      {
        san: 'Be6+',
        label: '1. Be6+ (Check without capture)',
        isCorrect: false,
        coachFeedback: 'Why give a check when you can directly win the queen with Bxf7+?',
      },
    ],
  },
  {
    id: 'puz-06',
    number: 6,
    title: 'The Fool\'s Trap',
    subtitle: 'Black to move · Punish White\'s opening mistake',
    theme: 'Mate in 1',
    rating: 650,
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/6P1/5P2/PPPPP2P/RNBQKBNR b KQkq - 0 2',
    turn: 'b',
    solutionSan: 'Qh4#',
    coachHint: 'White pushed f3 and g4, creating a fatal diagonal straight into their King on e1. Launch Black\'s Queen!',
    explanation: '1... Qh4# is the famous Fool\'s Mate! It is the fastest checkmate in chess, exploiting White\'s unprovoked weakening of the e1-h4 diagonal.',
    xpReward: 30,
    choices: [
      {
        san: 'Qh4#',
        label: '1... Qh4# (Queen strikes the weakened diagonal!)',
        isCorrect: true,
        coachFeedback: '🏆 Incredible! The fastest checkmate in chess history executed to perfection!',
      },
      {
        san: 'Nf6',
        label: '1... Nf6 (Develop Knight)',
        isCorrect: false,
        coachFeedback: 'Normal development is good, but Qh4# finishes the game immediately!',
      },
      {
        san: 'd5',
        label: '1... d5 (Push center pawn)',
        isCorrect: false,
        coachFeedback: 'Don\'t let White off the hook! The e1-h4 diagonal is wide open for Qh4#!',
      },
    ],
  },
  {
    id: 'puz-07',
    number: 7,
    title: 'The Battery Beam',
    subtitle: 'White to move · Queen & Bishop battery mate',
    theme: 'Battery Mate',
    rating: 900,
    fen: '7k/6p1/8/8/4Q3/8/2B5/4K3 w - - 0 1',
    turn: 'w',
    solutionSan: 'Qh7#',
    coachHint: 'Queen on e4 and Bishop on c2 are lined up on the b1-h7 diagonal like a laser battery. Fire!',
    explanation: '1. Qh7# delivers checkmate! The Bishop on c2 shields the Queen on h7, leaving the Black King with no flight squares.',
    xpReward: 35,
    choices: [
      {
        san: 'Qh7#',
        label: '1. Qh7# (Battery fires straight into h7!)',
        isCorrect: true,
        coachFeedback: '💥 Direct hit! The Queen + Bishop battery proves totally unstoppable!',
      },
      {
        san: 'Qa8',
        label: '1. Qa8 (Back rank try)',
        isCorrect: false,
        coachFeedback: 'Qa8 doesn\'t check the king on h8. Qh7# is immediate checkmate!',
      },
      {
        san: 'Bb3',
        label: '1. Bb3 (Reposition Bishop)',
        isCorrect: false,
        coachFeedback: 'Your bishop is already perfectly placed on c2 to support Qh7#!',
      },
    ],
  },
  {
    id: 'puz-08',
    number: 8,
    title: 'Deflection Strike',
    subtitle: 'White to move · Overwhelm the overloaded defender',
    theme: 'Deflection',
    rating: 950,
    fen: '3r2k1/5ppp/1Q6/8/8/8/5PPP/6K1 w - - 0 1',
    turn: 'w',
    solutionSan: 'Qxd8#',
    coachHint: 'Black\'s Rook on d8 is the only piece defending their 8th rank. Take it with the Queen!',
    explanation: '1. Qxd8# captures the lone rook and simultaneously delivers a back rank checkmate on the Black King.',
    xpReward: 40,
    choices: [
      {
        san: 'Qxd8#',
        label: '1. Qxd8# (Capture the rook and checkmate!)',
        isCorrect: true,
        coachFeedback: '🎯 Flawless! Eliminating the defender seals the win in one shot!',
      },
      {
        san: 'Qb1',
        label: '1. Qb1 (Defend back rank)',
        isCorrect: false,
        coachFeedback: 'White is on offense! Don\'t defend when you can take Black\'s rook on d8!',
      },
      {
        san: 'h4',
        label: '1. h4 (Pawn push)',
        isCorrect: false,
        coachFeedback: 'Don\'t give Black time to escape. 1. Qxd8# wins the game instantly!',
      },
    ],
  },
  {
    id: 'puz-09',
    number: 9,
    title: 'The Arabian Mate',
    subtitle: 'White to move · Legendary Rook + Knight partnership',
    theme: 'Arabian Mate',
    rating: 1000,
    fen: '7k/R7/5N2/8/8/8/8/4K3 w - - 0 1',
    turn: 'w',
    solutionSan: 'Rh7#',
    coachHint: 'The Knight on f6 covers g8 and h7. Slide the Rook along the 7th rank to finish the King off!',
    explanation: '1. Rh7# is the legendary Arabian Mate! The Knight on f6 defends the Rook on h7 and blocks g8, trapping the King in the corner.',
    xpReward: 40,
    choices: [
      {
        san: 'Rh7#',
        label: '1. Rh7# (The historic Arabian Mate!)',
        isCorrect: true,
        coachFeedback: '🌟 Pure artistry! The ancient Arabian Mate executed like a Grandmaster!',
      },
      {
        san: 'Ra8+',
        label: '1. Ra8+ (Check on back rank)',
        isCorrect: false,
        coachFeedback: 'Ra8+ allows Black\'s king to move to g7! Rh7# checkmates immediately.',
      },
      {
        san: 'Ne4',
        label: '1. Ne4 (Reposition Knight)',
        isCorrect: false,
        coachFeedback: 'The knight on f6 is in the perfect position! Slide the rook to h7 for checkmate!',
      },
    ],
  },
  {
    id: 'puz-10',
    number: 10,
    title: 'The Guillotine Mate',
    subtitle: 'White to move · Bishop & Queen epaulette finish',
    theme: 'Epaulette Mate',
    rating: 900,
    fen: '3rkr2/8/8/2B1Q3/8/8/8/6K1 w - - 0 1',
    turn: 'w',
    solutionSan: 'Qe7#',
    coachHint: 'Black\'s own rooks on d8 and f8 block the King\'s escape sideways. Land the Queen right in between!',
    explanation: '1. Qe7# is an Epaulette Checkmate! The Black King cannot move left or right due to friendly Rooks on d8 and f8, and the Queen on e7 is securely defended by the Bishop on c5.',
    xpReward: 35,
    choices: [
      {
        san: 'Qe7#',
        label: '1. Qe7# (Epaulette Checkmate!)',
        isCorrect: true,
        coachFeedback: '👑 Royal execution! The rooks became a trap for their own king!',
      },
      {
        san: 'Bxf8',
        label: '1. Bxf8 (Capture Rook)',
        isCorrect: false,
        coachFeedback: 'Capturing a rook wins material, but 1. Qe7# wins the entire game!',
      },
      {
        san: 'Qh5+',
        label: '1. Qh5+ (Queen check from distance)',
        isCorrect: false,
        coachFeedback: 'Qh5+ allows the king to escape. Strike right into the heart with Qe7#!',
      },
    ],
  },
];

export function getPuzzleById(id: string): PuzzleItem | undefined {
  return CHESS_PUZZLES.find((p) => p.id === id);
}

export function getPuzzleByNumber(num: number): PuzzleItem {
  return CHESS_PUZZLES.find((p) => p.number === num) || CHESS_PUZZLES[0];
}

export function getAllPuzzles(): PuzzleItem[] {
  return CHESS_PUZZLES;
}

export function getNextPuzzleId(currentId: string): string {
  const currentIndex = CHESS_PUZZLES.findIndex((p) => p.id === currentId);
  const nextIndex = (currentIndex + 1) % CHESS_PUZZLES.length;
  return CHESS_PUZZLES[nextIndex].id;
}
