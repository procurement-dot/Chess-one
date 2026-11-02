export interface TimedPlacementMatch {
  id: number;
  domain: string;
  title: string;
  subtitle: string;
  timeSeconds: number; // 90 seconds (1.5 minutes)
  coachGreeting: string;
  focusTip: string;
}

export const TIMED_PLACEMENT_MATCHES: TimedPlacementMatch[] = [
  {
    id: 1,
    domain: 'Opening & Board Control',
    title: 'Match 1: Center Domination',
    subtitle: '1.5 Min Blitz · Open Board',
    timeSeconds: 90,
    coachGreeting: 'Welcome to Match 1! You have 1.5 minutes. Fight for the 4 central squares and develop your pieces!',
    focusTip: 'Tip: 1. e4 or 1. d4 lets your Knights and Bishops jump into the center early.',
  },
  {
    id: 2,
    domain: 'Tactical Awareness & Material',
    title: 'Match 2: Material Hunter',
    subtitle: '1.5 Min Blitz · Tactical Eye',
    timeSeconds: 90,
    coachGreeting: 'Match 2 begins! Keep an eye on every piece. Spot and punish undefended pieces!',
    focusTip: 'Tip: Scan the board before moving. Capture free enemy pieces and protect your own.',
  },
  {
    id: 3,
    domain: 'King Safety & Defense',
    title: 'Match 3: The King’s Fortress',
    subtitle: '1.5 Min Blitz · Solid Defense',
    timeSeconds: 90,
    coachGreeting: 'Match 3! Coach One will launch a sharp flank attack. Castle your King into safety.',
    focusTip: 'Tip: Castle Kingside (O-O) to tuck your King safely behind a three-pawn wall.',
  },
  {
    id: 4,
    domain: 'Attacking Coordination',
    title: 'Match 4: Attack the King',
    subtitle: '1.5 Min Blitz · Attack Net',
    timeSeconds: 90,
    coachGreeting: 'Match 4! Combine your Queen, Rooks, and minor pieces to hunt down the enemy King.',
    focusTip: 'Tip: Coordinate two pieces together against enemy targets to break through.',
  },
  {
    id: 5,
    domain: 'Grand Diagnostic Showdown',
    title: 'Match 5: The Final Battle',
    subtitle: '1.5 Min Blitz · Complete Strategy',
    timeSeconds: 90,
    coachGreeting: 'The final diagnostic match! Win on time, material, or deliver checkmate to seal your level!',
    focusTip: 'Tip: Stay calm under clock pressure. Fast, thoughtful moves lead to victory.',
  },
];
