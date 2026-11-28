export interface QuizData {
  question: string;
  options: string[];
  correctIndex: number;
  coachHint: string;
  explanation: string;
}

export interface LevelVideo {
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: string;
  title?: string;
  badge?: string;
}

export type TierCategory =
  | 'Foundation'
  | 'Pre-Intermediate'
  | 'Intermediate'
  | 'Pre-Advance'
  | 'Advance'
  | 'Developing'
  | 'Advanced';

export interface LevelData {
  id: number;
  worldId: number;
  worldTitle: string;
  category: TierCategory;
  title: string;
  pieceSymbol: string;
  eyebrow: string;
  ruleTitle: string;
  ruleDescription: string;
  xpReward: number;
  initialFen?: string;
  video?: LevelVideo;
  quiz: QuizData;
}

/**
 * ============================================================================
 * CHESSONE REAL CURRICULUM LEVELS (30 COMPREHENSIVE SYLLABUS LESSONS)
 * ============================================================================
 * Sourced directly from the official 6-page Course Content Syllabus & Lichess Puzzles:
 * - Tier 1: Foundation (Levels 1 - 6) • Rating 600 - 800 ELO
 * - Tier 2: Pre-Intermediate (Levels 7 - 12) • Rating 800 - 1100 ELO
 * - Tier 3: Intermediate (Levels 13 - 18) • Rating 1100 - 1400 ELO
 * - Tier 4: Pre-Advance (Levels 19 - 24) • Rating 1400 - 1700 ELO
 * - Tier 5: Advance (Levels 25 - 30) • Rating 1700+ ELO
 * ============================================================================
 */
export const LEARN_LEVELS: LevelData[] = [
  // --------------------------------------------------------------------------
  // TIER 1: FOUNDATION (Levels 1 - 6) • Beginner Mastery
  // --------------------------------------------------------------------------
  {
    id: 1,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: 'Introduction of Chess Board',
    pieceSymbol: '▦',
    eyebrow: 'FOUNDATION · LEVEL 1 · +20 XP',
    ruleTitle: 'Board Setup, 64 Squares & Coordinates',
    ruleDescription:
      'The chessboard is an 8x8 grid of 64 alternating light and dark squares: 32 light and 32 dark. Vertical columns are files (a-h) and horizontal rows are ranks (1-8). Always remember the golden rule: "White on right!" — the bottom-right corner square must always be light for both players.',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      duration: '1:45 min',
      title: 'Board Setup & The Golden Rule: White on Right!',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'Which square must be on the bottom-right corner for each player?',
      options: ['A dark square', 'A light (white) square', 'Any square, it does not matter'],
      correctIndex: 1,
      coachHint: 'Remember the classic rhyme: "White on the right!"',
      explanation: 'Always set up the board so that a light square is on the bottom right corner (h1 for White, a8 for Black).',
    },
  },
  {
    id: 2,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: 'Introduction of Chess Pieces & Values',
    pieceSymbol: '♔',
    eyebrow: 'FOUNDATION · LEVEL 2 · +20 XP',
    ruleTitle: 'Army Strength & Piece Valuation',
    ruleDescription:
      'Each army has 16 pieces: 8 Pawns, 2 Knights, 2 Bishops, 2 Rooks, 1 Queen, and 1 King. Pawns are worth 1 point, Knights and Bishops are 3 points each (minor pieces), Rooks are 5 points (major piece), and the Queen is worth 9 points! The King is priceless—if checkmated, the game ends.',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
      duration: '2:10 min',
      title: 'Chess Pieces & Numerical Values',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'Which chess piece has a numerical value of 9 points?',
      options: ['The Rook', 'The Queen', 'The Bishop'],
      correctIndex: 1,
      coachHint: 'It is the most powerful piece on the board!',
      explanation: 'The Queen is valued at 9 points because of her immense versatility and diagonal + orthogonal reach.',
    },
  },
  {
    id: 3,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: 'Piece Movements (3 Sessions)',
    pieceSymbol: '♞',
    eyebrow: 'FOUNDATION · LEVEL 3 · +20 XP',
    ruleTitle: 'The Movement Geometry of Every Piece',
    ruleDescription:
      'Rooks move along straight ranks and files. Bishops slice diagonally. The Queen moves in any straight direction. The King moves one square at a time. The Knight has a unique superpower: it moves in an L-shape (two squares in one direction, one to the side) and is the ONLY piece that can jump over other pieces!',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
      duration: '2:40 min',
      title: 'Mastering Legal Piece Movements',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'Can a Knight jump over friendly or enemy pieces on the chessboard?',
      options: ['Yes, Knights can jump over any piece in their way', 'No, pieces always block the Knight', 'Only over pawns'],
      correctIndex: 0,
      coachHint: 'The Knight is the only piece with jumping superpowers!',
      explanation: 'Knights leap directly to their destination square in an L-shape and cannot be blocked by pieces along the way.',
    },
  },
  {
    id: 4,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: 'Piece Captures (2 Sessions) & Revision',
    pieceSymbol: '⚔️',
    eyebrow: 'FOUNDATION · LEVEL 4 · +20 XP',
    ruleTitle: 'Capturing Squares & The Pawn Rule',
    ruleDescription:
      'Pieces capture enemy units by moving onto the square they occupy and removing them from the board. Pawns have a special capture rule: while they move straight forward, they capture ONE SQUARE DIAGONALLY forward! A pawn can never capture backwards or straight ahead.',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
      duration: '2:00 min',
      title: 'How Pieces Capture: Diagonal Pawn Strikes',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'How does a pawn capture an enemy piece?',
      options: ['One square diagonally forward', 'Straight forward one square', 'Two squares backward'],
      correctIndex: 0,
      coachHint: 'Pawns march straight, but strike diagonally!',
      explanation: 'Pawns only capture one square diagonally forward.',
    },
  },
  {
    id: 5,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: 'Check, Checkmate & Stalemate',
    pieceSymbol: '👑',
    eyebrow: 'FOUNDATION · LEVEL 5 · +20 XP',
    ruleTitle: 'Attack on the King vs Game-Ending Conditions',
    ruleDescription:
      '"Check" means the King is under direct attack and MUST escape immediately (by moving the King, blocking the attack, or capturing the attacking piece). If the King is in check and has NO legal escape, it is "Checkmate" (Win!). But if the King is NOT in check and has ZERO legal moves anywhere, it is a "Stalemate" (Draw!).',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?auto=format&fit=crop&w=800&q=80',
      duration: '2:30 min',
      title: 'Check, Checkmate vs Stalemate (Draw)',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'If a player has NO legal moves and their King is NOT in check, what is the result?',
      options: ['Stalemate (The game is a Draw!)', 'A loss for that player', 'A 5-minute time extension'],
      correctIndex: 0,
      coachHint: 'No check + no moves = Stalemate draw!',
      explanation: 'Under FIDE rules, stalemate occurs when the player to move has no legal moves and their King is not in check. The result is a half-point draw.',
    },
  },
  {
    id: 6,
    worldId: 1,
    worldTitle: 'Foundation',
    category: 'Foundation',
    title: '3 Special Positions: Castling, Promotion, En Passant',
    pieceSymbol: '🏰',
    eyebrow: 'FOUNDATION · LEVEL 6 · +20 XP',
    ruleTitle: 'The 3 Special Chess Rules',
    ruleDescription:
      'Castling allows the King and Rook to move together for King safety (neither must have moved, no pieces between, and King cannot castle out of, through, or into check). Promotion: when a pawn reaches the 8th rank, it instantly morphs into a Queen, Rook, Bishop, or Knight. En Passant: a pawn jumping two squares past an enemy pawn can be captured diagonally as if it only moved one square!',
    xpReward: 20,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      duration: '3:00 min',
      title: 'Castling, Promotion & En Passant',
      badge: 'Coach One Foundation',
    },
    quiz: {
      question: 'Can you castle while your King is currently in check?',
      options: ['No, you must escape check first', 'Yes, castling is allowed in check', 'Only if the rook is protected'],
      correctIndex: 0,
      coachHint: 'You cannot castle while under active attack!',
      explanation: 'FIDE rules strictly forbid castling when the King is in check or passing through attacked squares.',
    },
  },

  // --------------------------------------------------------------------------
  // TIER 2: PRE-INTERMEDIATE (Levels 7 - 12) • Early Tactics & Mates
  // --------------------------------------------------------------------------
  {
    id: 7,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Mating with 2 Rooks (Lawnmower Mate)',
    pieceSymbol: '♜',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 7 · +25 XP',
    ruleTitle: 'The Rolling Rooks Ladder Technique',
    ruleDescription:
      'Two Rooks working together can checkmate any lone King with the Lawnmower method. One Rook cuts off the escape rank like a fence, while the second Rook delivers check to push the King back. Alternate your rooks row by row until the King is trapped against the edge of the board!',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      duration: '2:15 min',
      title: 'The Lawnmower Mate with Two Rooks',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'In the Lawnmower mate with two Rooks, what is the job of the first Rook?',
      options: ['To cut off the King’s escape rank', 'To deliver checks from the center', 'To sacrifice itself'],
      correctIndex: 0,
      coachHint: 'One rook fences, the second pushes!',
      explanation: 'One rook forms a barrier that the king cannot cross, while the other rook steps forward to push the king back.',
    },
  },
  {
    id: 8,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Typical Mating Constructions & Mate in 1',
    pieceSymbol: '🎯',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 8 · +25 XP',
    ruleTitle: 'Recognizing One-Move Checkmates',
    ruleDescription:
      'Mastering Mate in 1 allows you to instantly spot game-winning blows in your matches. Typical mating patterns include the Kiss of Death (Queen supported right next to King), Anastasia’s Mate, and corridor mates. Always search for checks and undefended squares around the enemy monarch.',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
      duration: '2:20 min',
      title: 'Mating Patterns & Instant Knockout Checks',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'In the "Kiss of Death" mating pattern, what piece delivers the mate right next to the King with protection?',
      options: ['The Queen supported by another friendly piece', 'The lone King', 'An isolated Pawn'],
      correctIndex: 0,
      coachHint: 'The Queen gets right up in the King’s face, defended from behind!',
      explanation: 'A supported Queen delivering check right in front of the enemy King leaves zero escape squares and cannot be captured.',
    },
  },
  {
    id: 9,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Back Rank Mate & Mating with 1 Rook',
    pieceSymbol: '🚪',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 9 · +25 XP',
    ruleTitle: 'Corridor Checkmates & Single Rook Endgame',
    ruleDescription:
      'When castled pawns (f7, g7, h7) have not moved, the enemy King has no "luft" (breathing room). An invading Rook on the 8th rank creates an unavoidable Back Rank Mate! In single Rook endings, use your own King to cut off the opponent before delivering the final checkmate.',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
      duration: '2:35 min',
      title: 'Exploiting the Back Rank & Single Rook Mate',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'How do players prevent a back-rank checkmate for their castled King?',
      options: ['Push a pawn (e.g. h3 or g3) to create "luft" (an escape square)', 'Move the King to the center on move 5', 'Resign immediately'],
      correctIndex: 0,
      coachHint: '"Luft" means air — give your king an escape window!',
      explanation: 'Pushing h3 or g3 provides an open square for the King to step up to if checked on the back rank.',
    },
  },
  {
    id: 10,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Common Tactical Idea: The Absolute & Relative Pin',
    pieceSymbol: '📌',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 10 · +25 XP',
    ruleTitle: 'Freezing Enemy Defenders',
    ruleDescription:
      'A "Pin" occurs when a long-range piece (Bishop, Rook, Queen) attacks an enemy piece shielding a more valuable piece behind it. An "Absolute Pin" shields the King—moving the pinned piece is strictly ILLEGAL. A "Relative Pin" shields the Queen—moving it is legal, but catastrophic!',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
      duration: '2:45 min',
      title: 'The Power of the Pin: Absolute vs Relative',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'Can an enemy piece in an Absolute Pin legally move away from the pin?',
      options: ['No, moving it would expose the King to check (Illegal move)', 'Yes, if it captures something', 'Only if the player has less than 1 minute'],
      correctIndex: 0,
      coachHint: 'Exposing your own King to check is strictly forbidden!',
      explanation: 'Under FIDE rules, moving an absolutely pinned piece is illegal because it puts your own King in check.',
    },
  },
  {
    id: 11,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Double Attack & Knight Fork',
    pieceSymbol: '🍴',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 11 · +25 XP',
    ruleTitle: 'Attacking Two Targets with One Move',
    ruleDescription:
      'A Double Attack occurs when one move creates two simultaneous threats that the opponent cannot defend together. The most famous double attack is the "Fork"—especially by the Knight! When a Knight attacks the enemy King and Queen at the same time, the King must move and the Queen is captured!',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?auto=format&fit=crop&w=800&q=80',
      duration: '2:50 min',
      title: 'The Knight Fork: Royal Forks & Double Threats',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'What is a "Royal Fork" in chess tactics?',
      options: ['A Knight attacking the King and Queen simultaneously', 'A pawn capturing a rook', 'Castling with the King'],
      correctIndex: 0,
      coachHint: 'Royal means King & Queen both in crosshairs!',
      explanation: 'A Royal Fork hits both the King and Queen. The King must escape check, leaving the Queen helpless to be captured.',
    },
  },
  {
    id: 12,
    worldId: 2,
    worldTitle: 'Pre-Intermediate',
    category: 'Pre-Intermediate',
    title: 'Deflection - Mating Motives & Material Advantage',
    pieceSymbol: '🪃',
    eyebrow: 'PRE-INTERMEDIATE · LEVEL 12 · +25 XP',
    ruleTitle: 'Removing Key Defenders from Critical Posts',
    ruleDescription:
      'Deflection is a tactical technique where you force or lure an opponent’s piece away from defending a vital square or piece. By sacrificing a pawn or piece on one square, you pull the defender away, allowing your other pieces to deliver checkmate or win massive material!',
    xpReward: 25,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      duration: '3:10 min',
      title: 'Tactical Deflection: Luring Defenders Away',
      badge: 'Coach One Pre-Intermediate',
    },
    quiz: {
      question: 'What is the goal of a tactical Deflection?',
      options: ['To lure an enemy defender away from its critical defensive post', 'To trade queens immediately', 'To promote a knight'],
      correctIndex: 0,
      coachHint: 'Pull the guard away from the doorway!',
      explanation: 'Deflection targets a piece performing vital defensive duties and forces it off its post.',
    },
  },

  // --------------------------------------------------------------------------
  // TIER 3: INTERMEDIATE (Levels 13 - 18) • Classical Games & Strategy
  // --------------------------------------------------------------------------
  {
    id: 13,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Uncrowned Champions - Classical Games',
    pieceSymbol: '📜',
    eyebrow: 'INTERMEDIATE · LEVEL 13 · +30 XP',
    ruleTitle: 'Mastering the Wisdom of 19th-Century Champions',
    ruleDescription:
      'Before official World Champions existed, legends like Paul Morphy and Adolf Anderssen demonstrated the pure power of rapid piece development, open lines, and attacking play. Studying classic games teaches you how to sacrifice material for devastating attacking initiative!',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      duration: '3:20 min',
      title: 'The Immortal Game & Paul Morphy’s Opera Game',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'What was Paul Morphy’s cardinal principle during the opening phase?',
      options: ['Rapid piece development and open diagonals towards the enemy king', 'Grabbing as many pawns as possible', 'Moving the Queen out on move 2'],
      correctIndex: 0,
      coachHint: 'Every move must bring a new piece into the attack!',
      explanation: 'Morphy won by mobilizing all his minor pieces faster than his opponents and tearing open lines.',
    },
  },
  {
    id: 14,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Forced Mate in Two & Calculation Exercises',
    pieceSymbol: '⏳',
    eyebrow: 'INTERMEDIATE · LEVEL 14 · +30 XP',
    ruleTitle: 'Two-Step Calculation: Check, Force, Knockout',
    ruleDescription:
      'In a "Forced Mate in Two", your first move must be so forcing (typically a check or quiet threat with no escape) that every legal reply by the opponent leads directly into an unstoppable checkmate on move two. Calculating 2 moves ahead separates beginner players from intermediate competitors!',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
      duration: '3:00 min',
      title: 'Forced Mate in Two Combinations',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'In calculating a forced mate in 2, what should you look for on your very first move?',
      options: ['A highly forcing move (like check or deflection) that limits enemy choices', 'A random pawn push', 'Trading rooks on the back rank'],
      correctIndex: 0,
      coachHint: 'Forcing moves leave the opponent zero counterplay!',
      explanation: 'Forcing candidate moves (checks, captures, immediate threats) severely restrict the opponent and guarantee the win.',
    },
  },
  {
    id: 15,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Mating with a Bishop Pair',
    pieceSymbol: '♝',
    eyebrow: 'INTERMEDIATE · LEVEL 15 · +30 XP',
    ruleTitle: 'Coordinating Diagonal Lasers to Trap the King',
    ruleDescription:
      'A Bishop pair working side-by-side controls adjacent diagonals like an impenetrable electric fence! To checkmate with two Bishops, your King and Bishops work together to herd the enemy King into one of the corners of the board, where the dark and light bishops deliver the final checkmate.',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
      duration: '3:15 min',
      title: 'Two Bishops Checkmate Technique',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'Where must the lone enemy King be driven to deliver checkmate with a Bishop pair?',
      options: ['Into any of the 4 corner squares', 'In the center of the board', 'On the d-file'],
      correctIndex: 0,
      coachHint: 'Bishops need the corner pocket to trap the king!',
      explanation: 'Checkmate with two bishops can only be forced in one of the corners of the board.',
    },
  },
  {
    id: 16,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Overload: Mating & Material Advantages',
    pieceSymbol: '⚖️',
    eyebrow: 'INTERMEDIATE · LEVEL 16 · +30 XP',
    ruleTitle: 'Exploiting Defending Pieces with Too Many Jobs',
    ruleDescription:
      'An "Overloaded Piece" is an enemy defender assigned to protect two or more critical squares or pieces at the same time. By attacking one of its protected targets, you force the overloaded piece to abandon its other duty, allowing your other pieces to breakthrough and win!',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
      duration: '2:50 min',
      title: 'Tactical Overload: Breaking the Defensive Chain',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'What is an "overloaded piece" in chess tactics?',
      options: ['A piece tasked with defending two different things at once', 'A piece that has moved 10 times', 'A queen with extra pawns'],
      correctIndex: 0,
      coachHint: 'One piece cannot be in two places at the same time!',
      explanation: 'When a piece guards two critical threats, striking one breaks the defense of the other.',
    },
  },
  {
    id: 17,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Introduction to King and Pawn Endings',
    pieceSymbol: '♟️',
    eyebrow: 'INTERMEDIATE · LEVEL 17 · +30 XP',
    ruleTitle: 'The Opposition, Key Squares & The Rule of the Square',
    ruleDescription:
      'In the endgame, the King transforms into a fierce attacking warrior! The most fundamental endgame concept is "The Opposition"—placing your King directly opposite the enemy King with an odd number of squares between them. Seizing opposition allows your King to outflank the opponent and usher your pawn to promotion.',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?auto=format&fit=crop&w=800&q=80',
      duration: '3:30 min',
      title: 'King & Pawn Endings: Direct Opposition & Outflanking',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'What does "direct opposition" mean in a King and pawn endgame?',
      options: ['Kings face each other on the same file/rank with exactly 1 square between them', 'Kings are touching', 'Pawns are locked in the center'],
      correctIndex: 0,
      coachHint: 'One square between kings—whoever has to move must give way!',
      explanation: 'Holding opposition forces the enemy King to step aside, allowing your King to advance.',
    },
  },
  {
    id: 18,
    worldId: 3,
    worldTitle: 'Intermediate',
    category: 'Intermediate',
    title: 'Opening Masterclass: The Ruy Lopez & Scotch',
    pieceSymbol: '🇪🇸',
    eyebrow: 'INTERMEDIATE · LEVEL 18 · +30 XP',
    ruleTitle: 'Classical 1.e4 Opening Strategy',
    ruleDescription:
      'The Ruy Lopez (1.e4 e5 2.Nf3 Nc6 3.Bb5) is the Spanish Game—the cornerstone of opening mastery played by every World Champion. In the Scotch Game (3.d4), White immediately strikes at the center to open lines. Understanding these openings teaches you harmonious piece play, pawn structures, and central control.',
    xpReward: 30,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      duration: '3:45 min',
      title: 'The Spanish Game (Ruy Lopez) & The Scotch',
      badge: 'Coach One Intermediate',
    },
    quiz: {
      question: 'In the Scotch Opening (1.e4 e5 2.Nf3 Nc6), what is White’s aggressive central 3rd move?',
      options: ['3. d4 (Striking the center immediately)', '3. h3', '3. a4'],
      correctIndex: 0,
      coachHint: 'Break open the center on move 3!',
      explanation: '3. d4 challenges Black’s e5 pawn right away and opens diagonals for White’s bishops.',
    },
  },

  // --------------------------------------------------------------------------
  // TIER 4: PRE-ADVANCE (Levels 19 - 24) • Advanced Tactics & Rules
  // --------------------------------------------------------------------------
  {
    id: 19,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: "Vulnerabilities in Opponent's Position",
    pieceSymbol: '🔍',
    eyebrow: 'PRE-ADVANCE · LEVEL 19 · +35 XP',
    ruleTitle: 'Spotting Tactical Targets: LPDO & Weak Complexes',
    ruleDescription:
      'Grandmaster John Nunn coined the famous rule: "Loose Pieces Drop Off" (LPDO)! Whenever an opponent leaves a piece undefended or uncoordinated, tactical opportunities arise. Learn to spot weak color complexes, holes in pawn structures, and uncastled kings in the center.',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      duration: '3:10 min',
      title: 'Finding Tactical Targets: LPDO & Structural Holes',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'What does GM John Nunn’s rule "LPDO" stand for in chess analysis?',
      options: ['Loose Pieces Drop Off (Undefended pieces are vulnerable)', 'Late Pawns Deliver Openings', 'Long Passes Defend Offense'],
      correctIndex: 0,
      coachHint: 'Unprotected pieces are magnets for tactical combinations!',
      explanation: 'Undefended pieces are the primary trigger for forks, pins, and tactical strikes.',
    },
  },
  {
    id: 20,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: 'Line Clearance - Mating & Material Advantage',
    pieceSymbol: '🛣️',
    eyebrow: 'PRE-ADVANCE · LEVEL 20 · +35 XP',
    ruleTitle: 'Vacating Files, Ranks & Diagonals with Tempo',
    ruleDescription:
      'Line clearance is a sacrifice or forced move designed to vacate a rank, file, or diagonal so a teammate piece can deliver a decisive strike. By pushing a pawn or jumping a knight out of the way with check, you clear the highway for your Queen or Rooks!',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
      duration: '3:20 min',
      title: 'Line Clearance Sacrifices & Highway Attacks',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'What is the tactical purpose of a "Line Clearance"?',
      options: ['To vacate a file or diagonal so another piece can attack through it', 'To castle with both rooks', 'To trade all queens'],
      correctIndex: 0,
      coachHint: 'Move your own piece out of the way so a stronger piece behind can fire!',
      explanation: 'Clearing a clogged diagonal or file unleashes powerful attacks from heavy pieces.',
    },
  },
  {
    id: 21,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: 'Liquidation of Defence & Attack on King',
    pieceSymbol: '🛡️',
    eyebrow: 'PRE-ADVANCE · LEVEL 21 · +35 XP',
    ruleTitle: 'Removing the Guard & Kingside Assaults',
    ruleDescription:
      'When the enemy King is sheltered by defensive pieces (like a Knight on f6 or Bishop on g7), direct attacks might fail. By using "Liquidation of Defence" (capturing or deflecting the crucial bodyguard piece), the entire defensive shield collapses, leaving the King helpless.',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
      duration: '3:30 min',
      title: 'Removing the Guard & Kingside Breakthroughs',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'In kingside attacks, why is removing the enemy Knight on f6/f3 so crucial?',
      options: ['The f6/f3 Knight is the chief protector of the h7/h2 mating square', 'It moves in an L-shape', 'It protects the a-file'],
      correctIndex: 0,
      coachHint: 'Take out the bodyguard on f6 to smash into h7!',
      explanation: 'The f6 knight defends h7 and g4; eliminating it opens the floodgates for queen and bishop checkmates.',
    },
  },
  {
    id: 22,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: 'Intermediate Move (Zwischenzug) - In-between Checks',
    pieceSymbol: '⚡',
    eyebrow: 'PRE-ADVANCE · LEVEL 22 · +35 XP',
    ruleTitle: 'The Deadly In-Between Move',
    ruleDescription:
      '"Zwischenzug" (German for in-between move) is a master-level tactical surprise. Instead of playing the expected recapture right away, you insert an intermediate check or capture that changes the position entirely, turning an apparent loss into a crushing victory!',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
      duration: '3:15 min',
      title: 'The Zwischenzug: Turning Trades into Wins',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'What is a "Zwischenzug" in chess tactics?',
      options: ['An unexpected in-between move that interrupts an expected sequence of trades', 'A special pawn move on row 1', 'Resigning on move 20'],
      correctIndex: 0,
      coachHint: 'Do not recapture automatically—look for an in-between check first!',
      explanation: 'An in-between check or counter-threat refutes opponent assumptions before recapturing.',
    },
  },
  {
    id: 23,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: 'Introduction to French Defence & King Endgames',
    pieceSymbol: '🇫🇷',
    eyebrow: 'PRE-ADVANCE · LEVEL 23 · +35 XP',
    ruleTitle: 'Pawn Chain Strategy & Practical King Endings',
    ruleDescription:
      'The French Defence (1.e4 e6 2.d4 d5) creates asymmetrical pawn chains: White attacks the kingside with an e5 pawn wedge, while Black counterattacks White’s pawn base with ...c5. In the endgame, understanding pawn breaks and King positioning determines who wins the race to promote.',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?auto=format&fit=crop&w=800&q=80',
      duration: '3:40 min',
      title: 'French Defence Structures & King Race Endgames',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'In the French Defence, where does Black focus their primary counterattack against White’s center?',
      options: ['At the base of White’s pawn chain with the ...c5 pawn break', 'On the h-file', 'By advancing the g-pawn'],
      correctIndex: 0,
      coachHint: 'Attack the base of the chain at d4!',
      explanation: 'Striking White’s pawn chain at the d4 base with ...c5 undermines White’s central wedge.',
    },
  },
  {
    id: 24,
    worldId: 4,
    worldTitle: 'Pre-Advance',
    category: 'Pre-Advance',
    title: 'Main Tournament Rules & Chess Clock Usage',
    pieceSymbol: '⏱️',
    eyebrow: 'PRE-ADVANCE · LEVEL 24 · +35 XP',
    ruleTitle: 'Official FIDE Rules, Touch-Move & Clock Etiquette',
    ruleDescription:
      'In competitive school and FIDE tournaments, rules are strictly enforced! The Touch-Move rule means if you deliberately touch a piece, you MUST move it. If you touch an enemy piece, you MUST capture it. Crucially, you must always press the chess clock with the EXACT same hand that made the move!',
    xpReward: 35,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      duration: '2:50 min',
      title: 'Tournament Regulations: Touch-Move & Clocks',
      badge: 'Coach One Pre-Advance',
    },
    quiz: {
      question: 'Under official tournament rules, which hand must you use to press the chess clock after making your move?',
      options: ['The exact same hand that made the chess move', 'Either hand is allowed', 'You can ask the arbiter to press it'],
      correctIndex: 0,
      coachHint: 'Move with right hand -> press clock with right hand!',
      explanation: 'FIDE Handbook Article 6.2 strictly requires players to press the clock with the same hand that made the move.',
    },
  },

  // --------------------------------------------------------------------------
  // TIER 5: ADVANCE (Levels 25 - 30) • Tournament Mastery
  // --------------------------------------------------------------------------
  {
    id: 25,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Discovered Attack & Discovered Check Masterclass',
    pieceSymbol: '💥',
    eyebrow: 'ADVANCE · LEVEL 25 · +40 XP',
    ruleTitle: 'The Lethal Two-Piece Battery',
    ruleDescription:
      'A Discovered Attack occurs when moving one piece unmasks a devastating attack from a friendly piece behind it. When the front piece moves with check (Discovered Check), the opponent MUST respond to the check, allowing your other piece to capture the Queen or deliver double-check mate!',
    xpReward: 40,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=800&q=80',
      duration: '3:30 min',
      title: 'Discovered Attacks & Double Checks',
      badge: 'Coach One Advance',
    },
    quiz: {
      question: 'Why is a "Double Check" (where both pieces deliver check simultaneously) the most lethal check in chess?',
      options: ['The King MUST move—it is impossible to block or capture two checking pieces at once', 'The game is an automatic draw', 'The player gets two turns'],
      correctIndex: 0,
      coachHint: 'You cannot block two attacks at the same time—the King must run!',
      explanation: 'Because two pieces are checking at once, blocking or capturing one still leaves check from the other. The King is forced to flee.',
    },
  },
  {
    id: 26,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Removal of Pawn Cover & King Hunts',
    pieceSymbol: '🧨',
    eyebrow: 'ADVANCE · LEVEL 26 · +40 XP',
    ruleTitle: 'Shattering the Castled Fortress',
    ruleDescription:
      'When an opponent’s castled King is safely tucked behind pawns, you must sacrifice material to shatter the pawn cover. Classic sacrifices include the "Greek Gift" (Bxh7+), double bishop sacrifices on h7 and g7, and pawn storms that expose the enemy King to a deadly hunt!',
    xpReward: 40,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1580541832626-2a7131ee809f?auto=format&fit=crop&w=800&q=80',
      duration: '3:45 min',
      title: 'The Greek Gift Sacrifice & Shattering King Covers',
      badge: 'Coach One Advance',
    },
    quiz: {
      question: 'What is the classic "Greek Gift" sacrifice in chess history?',
      options: ['A Bishop sacrifice on h7 (or h2) to drag the enemy King into the open', 'Sacrificing all pawns on move 1', 'Trading queens in the center'],
      correctIndex: 0,
      coachHint: 'Bishop crashes through on h7 with check!',
      explanation: 'Bxh7+ exposes the castled King, followed by Ng5+ and Qh5 with decisive mating threats.',
    },
  },
  {
    id: 27,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Knight vs Pawn Advanced Endgames',
    pieceSymbol: '🐎',
    eyebrow: 'ADVANCE · LEVEL 27 · +40 XP',
    ruleTitle: 'Barrier Building, Outside Passed Pawns & Knight Triangulation',
    ruleDescription:
      'Knights are short-range pieces that excel in closed positions but struggle against outside passed pawns on the edge of the board (a-file and h-file). Learn how to set up "barriers" where a Knight covers key advance squares, and when to trade into won King and pawn endings.',
    xpReward: 40,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586165368502-1bad197a6461?auto=format&fit=crop&w=800&q=80',
      duration: '3:40 min',
      title: 'Knight vs Pawn: Barrier Techniques & Rim Pawns',
      badge: 'Coach One Advance',
    },
    quiz: {
      question: 'Which enemy passed pawns are hardest for a defending Knight to stop in an endgame?',
      options: ['Rook pawns on the edge (a-file or h-file)', 'Center pawns on d-file', 'Doubled pawns'],
      correctIndex: 0,
      coachHint: 'Knights hate the rim—they lose half their mobility!',
      explanation: 'Because the Knight has limited mobility on the rim, stopping outside rook pawns is notoriously difficult.',
    },
  },
  {
    id: 28,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Playing as Black: How to Play Against 1.d4',
    pieceSymbol: '🛡️',
    eyebrow: 'ADVANCE · LEVEL 28 · +40 XP',
    ruleTitle: 'Neutralizing the London System & Queen’s Gambit',
    ruleDescription:
      'When White opens with 1.d4, you must be prepared for the solid London System (Bf4) and Queen’s Gambit (c4). As Black, learn dynamic defenses like the King’s Indian Defence, Nimzo-Indian, and Queen’s Gambit Declined to contest central control and launch active queenside counterplay.',
    xpReward: 40,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?auto=format&fit=crop&w=800&q=80',
      duration: '4:00 min',
      title: 'Black Repertory vs 1.d4: Defeating the London System',
      badge: 'Coach One Advance',
    },
    quiz: {
      question: 'Against the popular London System (1.d4 d5 2.Bf4), what is an effective plan for Black to contest the center?',
      options: ['Play ...c5 to immediately challenge White’s d4 pawn center', 'Push ...h5 on move 2', 'Never develop pieces'],
      correctIndex: 0,
      coachHint: 'Challenge d4 immediately with ...c5 and ...Qb6!',
      explanation: 'Playing ...c5 strikes White’s pawn pyramid and targets the weakened b2 square with ...Qb6.',
    },
  },
  {
    id: 29,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Thinking in Candidate Moves & Deep Calculation',
    pieceSymbol: '🧠',
    eyebrow: 'ADVANCE · LEVEL 29 · +40 XP',
    ruleTitle: 'The Grandmaster Thought Process (Kotov’s Method)',
    ruleDescription:
      'In GM Alexander Kotov’s classic "Think Like a Grandmaster", he revealed that strong players do NOT calculate randomly. Instead: 1. Survey the position, 2. Identify 2 to 4 Candidate Moves, 3. Calculate each candidate branch systematically without jumping back and forth. This eliminates blunders and sharpens your tactical intuition!',
    xpReward: 40,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1560174038-da43ac74f01b?auto=format&fit=crop&w=800&q=80',
      duration: '3:50 min',
      title: 'Grandmaster Calculation: Candidate Moves & Tree of Analysis',
      badge: 'Coach One Advance',
    },
    quiz: {
      question: 'What is the first step in Kotov’s calculation method before calculating deep lines?',
      options: ['Identify all candidate moves first before calculating any line', 'Play the first check you see', 'Calculate move 10 immediately'],
      correctIndex: 0,
      coachHint: 'List candidate moves A, B, C first, then calculate!',
      explanation: 'Identifying candidate moves ensures you do not overlook hidden tactical resources before committing to calculation.',
    },
  },
  {
    id: 30,
    worldId: 5,
    worldTitle: 'Advance',
    category: 'Advance',
    title: 'Master Graduation Exam & Tournament Analysis',
    pieceSymbol: '🎓',
    eyebrow: 'ADVANCE · LEVEL 30 · +100 XP',
    ruleTitle: 'Comprehensive KinderSports ChessOne Graduation Assessment',
    ruleDescription:
      'Congratulations on reaching the pinnacle of the ChessOne curriculum! Level 30 synthesizes everything: opening mastery, tactical combinations, liquidation of defense, complex endgames, and tournament psychology. Complete your graduation exam to earn your ChessOne Master Achievement and Certificate!',
    xpReward: 100,
    video: {
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?auto=format&fit=crop&w=800&q=80',
      duration: '5:00 min',
      title: 'Master Graduation Review & Grandmaster Advice',
      badge: 'Coach One Masterclass',
    },
    quiz: {
      question: 'What is the ultimate combination of chess mastery taught across the 5 Tiers?',
      options: ['Harmonious piece coordination, tactical vigilance, and patient endgame technique', 'Only memorizing openings', 'Moving only the Queen'],
      correctIndex: 0,
      coachHint: 'All parts of the game work as one unified harmony!',
      explanation: 'Mastery requires integrating opening principles, middle-game tactics, and precise endgame calculation.',
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
