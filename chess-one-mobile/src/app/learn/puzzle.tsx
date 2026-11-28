import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AppHeader } from '../../components/navigation/AppHeader';
import { COLORS, SIZES, FONTS, SHADOWS } from '../../constants/chessone-theme';
import { CHESS_PUZZLES, PuzzleItem, getPuzzleById, getNextPuzzleId, getPuzzleByNumber } from '../../data/learn';
import { apiClient } from '../../services/apiClient';
import { puzzleService, formatDbPuzzle } from '../../services/puzzle.service';
import { learnStore, useLearnStore } from '../../features/learn/learnStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChessBoard } from '../../components/chess/ChessBoard';
import { Chess, Square } from 'chess.js';
import { Feather } from '@expo/vector-icons';
import { CoachSpeechBubble } from '../../components/learn/CoachSpeechBubble';
import { soundService } from '../../services/soundService';

export default function PuzzleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { solvedPuzzles, tacticalRating = 1000 } = useLearnStore();

  const puzzleId = typeof id === 'string' && id ? id : 'jz5uh';
  const autoNextTimerRef = useRef<any>(null);
  const wrongResetTimerRef = useRef<any>(null);
  const [puzzle, setPuzzle] = useState<PuzzleItem>(() => getPuzzleById(puzzleId) || getPuzzleByNumber(1));
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [chess, setChess] = useState(() => new Chess(puzzle.fen));
  const [fen, setFen] = useState(puzzle.fen);
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Square[]>([]);
  const [lastMove, setLastMove] = useState<{ from: Square; to: Square } | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const [hintLevel, setHintLevel] = useState<number>(0); // 0 = none, 1 = piece highlight, 2 = full hint
  const [status, setStatus] = useState<'idle' | 'wrong' | 'success'>('idle');
  const [feedback, setFeedback] = useState<string>(puzzle.coachHint);

  const opponentMoveDisplay = useMemo(() => {
    if (puzzle.id === 'jz5uh') return 'Re8';
    if (puzzle.id === '1XlZs') return 'g4';
    return puzzle.turn === 'w' ? '... (Blunder)' : '1. ...';
  }, [puzzle.id, puzzle.turn]);

  const playerMoveDisplay = useMemo(() => {
    if (status === 'success') {
      return puzzle.solutionSan;
    }
    if (status === 'wrong') {
      return 'Incorrect ?';
    }
    return selectedSquare ? `${selectedSquare}...` : 'Your Move 🎯';
  }, [status, puzzle.solutionSan, selectedSquare]);

  // Clean up timers & speech on unmount
  useEffect(() => {
    return () => {
      soundService.stopSpeech();
      if (autoNextTimerRef.current) {
        clearTimeout(autoNextTimerRef.current);
        autoNextTimerRef.current = null;
      }
      if (wrongResetTimerRef.current) {
        clearTimeout(wrongResetTimerRef.current);
        wrongResetTimerRef.current = null;
      }
    };
  }, []);

  // Load from Supabase if not found in local curated list
  useEffect(() => {
    let cancelled = false;
    async function loadPuzzle() {
      const local = getPuzzleById(puzzleId);
      if (local) {
        setPuzzle(local);
        return;
      }
      try {
        let res;
        try {
          res = await apiClient.get(`/api/puzzles/${puzzleId}`);
        } catch {
          res = await apiClient.get(`/puzzles/${puzzleId}`);
        }
        if (res.data?.data && !cancelled) {
          const formatted = formatDbPuzzle(res.data.data, 1);
          if (formatted) setPuzzle(formatted);
        }
      } catch (err) {
        console.warn('Could not load puzzle from Supabase:', err);
      }
    }
    loadPuzzle();
    return () => {
      cancelled = true;
    };
  }, [puzzleId]);

  // Re-initialize state when puzzle changes
  useEffect(() => {
    if (wrongResetTimerRef.current) {
      clearTimeout(wrongResetTimerRef.current);
      wrongResetTimerRef.current = null;
    }
    if (autoNextTimerRef.current) {
      clearTimeout(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setFen(puzzle.fen);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setHintLevel(0);
    setStatus('idle');
    setIsResetting(false);
    soundService.stopSpeech();
    setIsSpeaking(false);
    const oppColor = puzzle.turn === 'w' ? "Black's" : "White's";
    const myColor = puzzle.turn === 'w' ? 'White' : 'Black';
    const initialLine = `Look at ${oppColor} King position. Find the winning tactic for ${myColor}!`;
    setFeedback(initialLine);

    // Coach One speaks objective out loud
    setIsSpeaking(true);
    soundService.speakCoach(initialLine, 'idle', () => setIsSpeaking(false));
  }, [puzzle.id, puzzle.fen]);

  // Find checked king's square if any
  const inCheckSquare = useMemo(() => {
    if (!chess.inCheck()) return null;
    const turn = chess.turn();
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p && p.type === 'k' && p.color === turn) {
          const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const rank = 8 - r;
          return `${files[c]}${rank}` as Square;
        }
      }
    }
    return null;
  }, [fen]);

  // Find the solution move pieces for Chess.com progressive hint
  const solutionDetails = useMemo(() => {
    try {
      const c = new Chess(puzzle.fen);
      const sol = c.move(puzzle.solutionSan);
      if (sol) {
        return {
          from: sol.from as Square,
          to: sol.to as Square,
          piece: sol.piece,
          san: sol.san,
        };
      }
    } catch {}
    return null;
  }, [puzzle.fen, puzzle.solutionSan]);

  // Chess.com-style Pure Board Touch & Move Handler
  const handleSquarePress = (square: Square) => {
    if (status === 'success' || isResetting) return;

    // 1. If clicking the currently selected piece, deselect
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setPossibleMoves([]);
      return;
    }

    // 2. If a piece is already selected and tapping a valid destination square
    if (selectedSquare && possibleMoves.includes(square)) {
      const from = selectedSquare;
      const to = square;

      setSelectedSquare(null);
      setPossibleMoves([]);

      try {
        const testChess = new Chess(fen);
        const moveResult = testChess.move({ from, to, promotion: 'q' });
        if (!moveResult) return;

        // Apply to local chess instance & update board visually
        chess.move({ from, to, promotion: 'q' });
        setFen(testChess.fen());
        setLastMove({ from, to });

        // Compare with solution
        const cleanMoveSan = moveResult.san.replace(/[+#x=]/g, '').trim();
        const cleanSolSan = puzzle.solutionSan.replace(/[+#x=]/g, '').trim();
        const isSolution =
          moveResult.san === puzzle.solutionSan || cleanMoveSan === cleanSolSan;

        if (isSolution) {
          // ==================== CORRECT MOVE (Chess.com Logic) ====================
          soundService.playSuccessSound();
          if (wrongResetTimerRef.current) clearTimeout(wrongResetTimerRef.current);
          setStatus('success');

          const isFirstCleanTry = hintLevel === 0;
          const delta = isFirstCleanTry ? 150 : 40;
          learnStore.recordPuzzleSolved(puzzle.id, puzzle.xpReward, delta);

          const newRating = tacticalRating + delta;
          const adaptiveNote = isFirstCleanTry
            ? `🔥 Brilliant move! First-try accuracy boosted your rating to ${newRating} ELO! Advancing to next puzzle...`
            : `✓ Correct move! Tactical rating is now ${newRating} ELO. Loading next puzzle...`;

          setFeedback(`⚡ EXCELLENT MOVE! ${moveResult.san} is the winning tactic!\n\n${adaptiveNote}`);

          // Coach One enthusiastically celebrates out loud!
          setTimeout(() => {
            setIsSpeaking(true);
            const speakLine = `Excellent move! ${moveResult.san} is the winning tactic! Brilliant move!`;
            soundService.speakCoach(speakLine, 'success', () => setIsSpeaking(false));
          }, 260);

          // Auto-advance after 1.8 seconds (Chess.com style)
          if (autoNextTimerRef.current) clearTimeout(autoNextTimerRef.current);
          autoNextTimerRef.current = setTimeout(() => {
            handleNextPuzzle();
          }, 1800);
        } else {
          // ==================== WRONG MOVE (Chess.com Logic) ====================
          soundService.playWrongSound();
          setStatus('wrong');
          learnStore.updateTacticalRating(-40);
          const wrongMsg = `Oops! ${moveResult.san} is not the winning tactic. Look for direct checkmate!`;
          setFeedback(wrongMsg);

          // Coach One guides and encourages out loud!
          setTimeout(() => {
            setIsSpeaking(true);
            soundService.speakCoach(wrongMsg, 'wrong', () => setIsSpeaking(false));
          }, 200);

          // Snap back after 850ms so White's turn is restored and board never freezes
          setIsResetting(true);
          if (wrongResetTimerRef.current) clearTimeout(wrongResetTimerRef.current);
          wrongResetTimerRef.current = setTimeout(() => {
            const freshChess = new Chess(puzzle.fen);
            setChess(freshChess);
            setFen(puzzle.fen);
            setSelectedSquare(null);
            setPossibleMoves([]);
            setLastMove(null);
            setStatus('idle');
            setIsResetting(false);
          }, 850);
        }
      } catch (err) {
        console.warn('handleSquarePress error:', err);
      }
      return;
    }

    // 3. Otherwise, select piece if on square and belongs to the puzzle's player side
    const piece = chess.get(square);
    const myTurn = puzzle.turn || 'w';
    if (piece && piece.color === myTurn) {
      setSelectedSquare(square);
      const legalMoves = chess.moves({ square, verbose: true });
      setPossibleMoves(legalMoves.map((m) => m.to as Square));
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  // Chess.com Progressive Hint System (💡)
  const handleHint = () => {
    if (status === 'success' || !solutionDetails) return;

    if (hintLevel === 0) {
      // Step 1: Highlight the piece that needs to move!
      setHintLevel(1);
      setSelectedSquare(solutionDetails.from);
      setPossibleMoves([solutionDetails.to]);
      const hintMsg = `Coach Hint: Look at your ${solutionDetails.piece.toUpperCase()} on ${solutionDetails.from.toUpperCase()}! Can it deliver the decisive blow?`;
      setFeedback(`💡 ${hintMsg}`);
      setIsSpeaking(true);
      soundService.speakCoach(hintMsg, 'idle', () => setIsSpeaking(false));
    } else {
      // Step 2: Show the exact destination and tactical idea
      setHintLevel(2);
      setSelectedSquare(solutionDetails.from);
      setPossibleMoves([solutionDetails.to]);
      const solMsg = `Winning Tactic: Move your ${solutionDetails.piece.toUpperCase()} to ${solutionDetails.to.toUpperCase()}!`;
      setFeedback(`🎯 ${solMsg} (${puzzle.solutionSan})`);
      setIsSpeaking(true);
      soundService.speakCoach(solMsg, 'idle', () => setIsSpeaking(false));
    }
  };

  // Chess.com "View Solution" - plays the correct move on the board for the student
  const handleViewSolution = () => {
    if (!solutionDetails) return;
    if (wrongResetTimerRef.current) clearTimeout(wrongResetTimerRef.current);

    try {
      const solChess = new Chess(puzzle.fen);
      const solMove = solChess.move(puzzle.solutionSan);
      if (solMove) {
        setFen(solChess.fen());
        setLastMove({ from: solMove.from as Square, to: solMove.to as Square });
        setSelectedSquare(null);
        setPossibleMoves([]);
        setStatus('wrong');
        const solMsg = `Solution: ${puzzle.solutionSan} — ${puzzle.explanation}`;
        setFeedback(solMsg);
        setIsSpeaking(true);
        soundService.speakCoach(solMsg, 'wrong', () => setIsSpeaking(false));
      }
    } catch (e) {
      console.warn('handleViewSolution error:', e);
    }
  };

  // Reset board back to initial puzzle FEN
  const handleReset = () => {
    soundService.stopSpeech();
    setIsSpeaking(false);
    soundService.playMoveSound();
    if (wrongResetTimerRef.current) {
      clearTimeout(wrongResetTimerRef.current);
      wrongResetTimerRef.current = null;
    }
    const newChess = new Chess(puzzle.fen);
    setChess(newChess);
    setFen(puzzle.fen);
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
    setHintLevel(0);
    setStatus('idle');
    setIsResetting(false);
    setFeedback(`Board reset! Find the strongest tactical move directly on the board.`);
  };

  const handleReplayCoachVoice = () => {
    setIsSpeaking(true);
    soundService.speakCoach(feedback, status, () => setIsSpeaking(false));
  };

  const navigateToPuzzle = (targetId: string) => {
    soundService.stopSpeech();
    setIsSpeaking(false);
    router.replace(`/learn/puzzle?id=${targetId}` as any);
  };

  const handleNextPuzzle = () => {
    soundService.playMoveSound();
    // Seamless progression: Level 1 -> 2 -> 3 ... 15 -> 16 -> 17 ... infinitely!
    const nextNumber = puzzle.number + 1;
    const nextPuz = getPuzzleByNumber(nextNumber);
    if (nextPuz) {
      navigateToPuzzle(nextPuz.id);
    }
  };

  const handleRandomPuzzle = () => {
    soundService.playMoveSound();
    const randomOffset = Math.floor(Math.random() * 20) + 1;
    const randomNum = Math.max(1, ((puzzle.number + randomOffset) % 100) + 1);
    const randomOne = getPuzzleByNumber(randomNum);
    navigateToPuzzle(randomOne.id);
  };

  const isAlreadySolved = solvedPuzzles.includes(puzzle.id);

  return (
    <View style={styles.container}>
      <AppHeader title="Tactics & Puzzles" showBack showLogo />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Sleek Chess.com-Style Top Control Bar */}
        <View style={styles.sleekTopBar}>
          {/* Left: Navigation & Level */}
          <View style={styles.topBarLeft}>
            <TouchableOpacity
              style={[styles.compactNavBtn, puzzle.number === 1 && styles.compactNavBtnDisabled]}
              disabled={puzzle.number === 1}
              onPress={() => {
                const prevNumber = Math.max(1, puzzle.number - 1);
                const prev = getPuzzleByNumber(prevNumber);
                if (prev) navigateToPuzzle(prev.id);
              }}
            >
              <Feather name="chevron-left" size={15} color={puzzle.number === 1 ? '#CBD5E1' : COLORS.textHeading} />
            </TouchableOpacity>

            <View style={styles.compactLevelBadge}>
              <Text style={styles.compactLevelText}>Level {puzzle.number}</Text>
            </View>

            <View style={styles.compactTurnPill}>
              <View
                style={[
                  styles.turnDotSmall,
                  { backgroundColor: puzzle.turn === 'w' ? '#FFFFFF' : '#1E293B' },
                ]}
              />
              <Text style={styles.compactTurnText}>
                {puzzle.turn === 'w' ? 'White' : 'Black'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.compactNavBtn}
              onPress={() => {
                const nextNumber = puzzle.number + 1;
                const next = getPuzzleByNumber(nextNumber);
                if (next) navigateToPuzzle(next.id);
              }}
            >
              <Feather name="chevron-right" size={15} color={COLORS.textHeading} />
            </TouchableOpacity>
          </View>

          {/* Right: ELO, Sound & Random */}
          <View style={styles.topBarRight}>
            <View style={styles.compactEloBadge}>
              <Text style={styles.compactEloText}>{puzzle.rating} ELO</Text>
            </View>

            <TouchableOpacity
              style={[styles.iconCircleBtn, !soundEnabled && { backgroundColor: '#F1F5F9' }]}
              onPress={() => {
                const nextSound = !soundEnabled;
                setSoundEnabled(nextSound);
                soundService.setSoundEnabled(nextSound);
                soundService.setVoiceEnabled(nextSound);
                if (!nextSound) {
                  soundService.stopSpeech();
                  setIsSpeaking(false);
                } else {
                  soundService.playMoveSound();
                  handleReplayCoachVoice();
                }
              }}
              activeOpacity={0.7}
            >
              <Feather
                name={soundEnabled ? (isSpeaking ? 'volume-2' : 'volume-1') : 'volume-x'}
                size={14}
                color={soundEnabled ? (isSpeaking ? '#2563EB' : COLORS.primary) : '#94A3B8'}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.iconCircleBtn} onPress={handleRandomPuzzle} activeOpacity={0.7}>
              <Text style={{ fontSize: 13 }}>🎲</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Compact Tactical Notation Strip directly above the board */}
        <View style={styles.compactNotationCard}>
          <View style={styles.notationOpponentBox}>
            <Text style={styles.notationMoveNum}>{puzzle.turn === 'w' ? '1...' : '1.'}</Text>
            <Text style={styles.notationMoveName}>{opponentMoveDisplay}</Text>
            <View style={styles.miniBlunderTag}>
              <Text style={styles.miniBlunderTagText}>? Blunder</Text>
            </View>
          </View>

          <Feather name="arrow-right" size={13} color="#94A3B8" />

          <View
            style={[
              styles.notationPlayerBox,
              status === 'success' && styles.notationPlayerSuccess,
              status === 'wrong' && styles.notationPlayerWrong,
            ]}
          >
            <Text style={styles.notationMoveNum}>{puzzle.turn === 'w' ? '2.' : '1...'}</Text>
            <Text
              style={[
                styles.notationPlayerMoveText,
                status === 'success' && { color: '#065F46', fontWeight: '800' },
                status === 'wrong' && { color: '#DC2626' },
              ]}
            >
              {playerMoveDisplay}
            </Text>
            {status === 'success' && (
              <View style={styles.miniBestTag}>
                <Text style={styles.miniBestTagText}>! Best</Text>
              </View>
            )}
            {status === 'wrong' && (
              <View style={styles.miniWrongTag}>
                <Text style={styles.miniWrongTagText}>? Mistake</Text>
              </View>
            )}
          </View>
        </View>

        {/* Interactive Chessboard (The HERO - Immediate Visual Focus) */}
        <View style={styles.boardCard}>
          <View style={styles.boardWrapper}>
            <ChessBoard
              fen={fen}
              selectedSquare={selectedSquare}
              possibleMoves={possibleMoves}
              lastMove={lastMove}
              inCheckSquare={inCheckSquare}
              onSquarePress={handleSquarePress}
              orientation={puzzle.turn === 'b' ? 'b' : 'w'}
            />
          </View>

          {/* Under-Board Live Mascot Coach Reaction */}
          <CoachSpeechBubble
            feedback={feedback}
            status={status}
            isSpeaking={isSpeaking}
            onReplayVoice={handleReplayCoachVoice}
          />

          {/* Prompt banner under board */}
          {status === 'idle' && (
            <View style={styles.playPromptBox}>
              <Text style={styles.playPromptText}>👆 Tap your piece to view moves, then tap destination!</Text>
            </View>
          )}

          {/* Success Banner (Chess.com Style) */}
          {status === 'success' && (
            <View style={styles.successBanner}>
              <View style={styles.bannerHeaderRow}>
                <Text style={{ fontSize: 24 }}>🎉</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Puzzle Solved! Master Move! 🚀</Text>
                  <Text style={styles.successXp}>
                    ⭐ +{puzzle.rating >= 1500 ? 3 : puzzle.rating >= 1000 ? 2 : 1} Stars earned · Rating updated to {tacticalRating} ELO!
                  </Text>
                </View>
              </View>
              <Text style={styles.successDesc}>{puzzle.explanation}</Text>

              <TouchableOpacity style={styles.nextPuzzleBtn} onPress={handleNextPuzzle}>
                <Text style={styles.nextPuzzleBtnText}>Next Puzzle ›</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Wrong Move Feedback Card with Try Again & View Solution (Chess.com Style) */}
          {status === 'wrong' && (
            <View style={styles.wrongBanner}>
              <View style={styles.bannerHeaderRow}>
                <Text style={{ fontSize: 22 }}>❌</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.wrongTitle}>Incorrect Move (-40 ELO)</Text>
                  <Text style={styles.wrongSubtitle}>Keep trying! You can find the winning tactic.</Text>
                </View>
              </View>

              <View style={styles.wrongActionsRow}>
                <TouchableOpacity style={styles.tryAgainBtn} onPress={handleReset}>
                  <Feather name="rotate-ccw" size={14} color={COLORS.white} />
                  <Text style={styles.tryAgainBtnText}>Try Again</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.viewSolBtn} onPress={handleViewSolution}>
                  <Feather name="eye" size={14} color={COLORS.primary} />
                  <Text style={styles.viewSolBtnText}>View Solution</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Chess.com-Style Bottom Control Actions */}
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.actionBtn} onPress={handleHint}>
              <Feather name="help-circle" size={16} color={hintLevel > 0 ? '#D97706' : COLORS.primary} />
              <Text style={[styles.actionBtnText, hintLevel > 0 && { color: '#D97706' }]}>
                {hintLevel === 0 ? 'Hint' : hintLevel === 1 ? 'Show Target' : 'Hint Used'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleReset}>
              <Feather name="rotate-ccw" size={15} color={COLORS.textBody} />
              <Text style={styles.actionBtnText}>Reset</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleViewSolution}>
              <Feather name="eye" size={15} color={COLORS.textBody} />
              <Text style={styles.actionBtnText}>Solution</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionBtn} onPress={handleNextPuzzle}>
              <Feather name="skip-forward" size={15} color={COLORS.primary} />
              <Text style={[styles.actionBtnText, { color: COLORS.primary }]}>Skip ›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16, paddingBottom: 60, maxWidth: 550, alignSelf: 'center', width: '100%', gap: 14 },
  sleekTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactNavBtnDisabled: {
    opacity: 0.35,
  },
  compactLevelBadge: {
    backgroundColor: '#E4EEDB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  compactLevelText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  compactTurnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  turnDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#94A3B8',
  },
  compactTurnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactEloBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  compactEloText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  iconCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAF7',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactNotationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  notationOpponentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  notationMoveNum: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  notationMoveName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },
  miniBlunderTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniBlunderTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  notationPlayerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAF7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notationPlayerSuccess: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  notationPlayerWrong: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  notationPlayerMoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  miniBestTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniBestTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  miniWrongTag: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniWrongTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  boardCard: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radiusCard,
    padding: 16,
    ...SHADOWS.soft,
    alignItems: 'center',
    gap: 12,
  },
  notationStripCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    ...SHADOWS.soft,
  },
  notationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  notationHeaderTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  liveText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#065F46',
  },
  notationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  opponentMoveCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFF5F5',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  moveNumberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
  },
  opponentMoveText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#991B1B',
  },
  blunderBadge: {
    marginLeft: 'auto',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  blunderBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  playerMoveCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAF7',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  playerMoveCellSuccess: {
    backgroundColor: '#F0FFF4',
    borderColor: '#BBF7D0',
  },
  playerMoveCellWrong: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FEE2E2',
  },
  playerMoveText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textHeading,
  },
  playerMoveTextSuccess: {
    color: '#065F46',
    fontWeight: '800',
  },
  playerMoveTextWrong: {
    color: '#DC2626',
  },
  brilliantBadge: {
    marginLeft: 'auto',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brilliantBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  wrongBadge: {
    marginLeft: 'auto',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  wrongBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#DC2626',
  },
  boardWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPromptBox: {
    width: '100%',
    backgroundColor: '#F8FAF7',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  playPromptText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
  successBanner: {
    width: '100%',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.progressFill,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  successTitle: { fontSize: 14, fontWeight: '800', color: '#065F46' },
  successDesc: { fontSize: 12, color: '#047857', lineHeight: 18 },
  successXp: { fontSize: 11, fontWeight: '700', color: COLORS.primary, marginTop: 1 },
  nextPuzzleBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  nextPuzzleBtnText: { color: COLORS.white, fontWeight: '700', fontSize: 12 },
  wrongBanner: {
    width: '100%',
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: '#FEB2B2',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  wrongTitle: { fontSize: 14, fontWeight: '800', color: '#991B1B' },
  wrongSubtitle: { fontSize: 11, color: '#B91C1C' },
  wrongActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  tryAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EF4444',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  tryAgainBtnText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  viewSolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  viewSolBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 12,
  },
  bottomActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F0F3EE',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAF7',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textBody,
  },
});
