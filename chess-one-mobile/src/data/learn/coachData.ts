export interface CoachDialogueSet {
  initialGreeting: string;
  openingPraise: string[];
  tacticalMoves: string[];
  undoReaction: string;
  resetReaction: string;
  generalPraise: string[];
}

export const COACH_DIALOGUES: Record<'Playful' | 'Calm', CoachDialogueSet> = {
  Playful: {
    initialGreeting: "Your cheeky chess companion! Tap a piece or click a move below to play!",
    openingPraise: [
      "Great opening! Taking control of the center like a boss!",
      "1. e4! Classical, sharp, and straight into the action!",
      "Nf3! Developing your knight before the bishops, classic master move!",
      "D-pawn push! You're building a rock-solid pyramid in the center!",
    ],
    tacticalMoves: [
      "Ooh, sneaky move! Putting pressure on my pieces!",
      "Developing pieces quickly — you are playing like a Grandmaster in training!",
      "Look at that knight leap! Beautiful outpost!",
      "Eyes on the enemy king! The tension is rising!",
    ],
    undoReaction: "Whoosh! Time-travel engaged. Let's find an even better move!",
    resetReaction: "Fresh board, fresh mind! Show me what you've got this round!",
    generalPraise: [
      "Brilliant! The board is yours to command!",
      "Nice choice! That piece is working overtime now!",
      "Solid harmony between your pieces! Keep it rolling!",
    ],
  },
  Calm: {
    initialGreeting: "Welcome to guided practice. Make a move and we will explore the position together.",
    openingPraise: [
      "Good opening. Controlling the central squares is essential.",
      "1. e4 opens paths for your queen and king's bishop immediately.",
      "Nf3 develops a minor piece while safeguarding your central control.",
      "A principled opening move establishing central presence.",
    ],
    tacticalMoves: [
      "Sound development. Your minor pieces are coordinated well.",
      "Good tactical awareness. You are applying pressure effectively.",
      "That square provides great mobility for your piece.",
      "Solid positional judgment. Maintain this discipline.",
    ],
    undoReaction: "Move retracted. Take your time to calculate carefully.",
    resetReaction: "Board reset. Approach the opening with patient calculation.",
    generalPraise: [
      "Accurate play. You are following sound chess fundamentals.",
      "Effective placement. Keep expanding your piece coordination.",
      "Very disciplined development. Well played.",
    ],
  },
};

export function getCoachReply(
  mood: 'Playful' | 'Calm',
  moveSan: string,
  moveIndex: number
): string {
  const set = COACH_DIALOGUES[mood];
  if (moveSan.startsWith('e4') || moveSan.startsWith('e5')) {
    return set.openingPraise[1] || set.openingPraise[0];
  }
  if (moveSan.startsWith('Nf3') || moveSan.startsWith('Nc3') || moveSan.startsWith('Nf6')) {
    return set.openingPraise[2] || set.openingPraise[0];
  }
  if (moveSan.startsWith('d4') || moveSan.startsWith('d5')) {
    return set.openingPraise[3] || set.openingPraise[0];
  }
  const pool = [...set.openingPraise, ...set.tacticalMoves, ...set.generalPraise];
  return pool[moveIndex % pool.length];
}
