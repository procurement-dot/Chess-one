const { Chess } = require('chess.js');

function runTests() {
  console.log('========================================');
  console.log('CHESS ONE - PHASE 3 VERIFICATION SUITE');
  console.log('========================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Basic Movement: Pawn, Knight, Bishop, Rook, Queen, King
  console.log('--- 1. Basic Movements ---');
  const game1 = new Chess();
  const pawnMove = game1.move({ from: 'e2', to: 'e4' });
  assert(Boolean(pawnMove), 'Pawn double step (e2 -> e4)');

  const knightMove = game1.move({ from: 'g8', to: 'f6' });
  assert(Boolean(knightMove), 'Knight move (g8 -> f6)');

  const bishopMove = game1.move({ from: 'f1', to: 'c4' });
  assert(Boolean(bishopMove), 'Bishop move (f1 -> c4)');

  const blackPawn = game1.move({ from: 'e7', to: 'e6' });
  assert(Boolean(blackPawn), 'Black Pawn single step (e7 -> e6)');

  const queenMove = game1.move({ from: 'd1', to: 'f3' });
  assert(Boolean(queenMove), 'Queen move (d1 -> f3)');

  const blackKnight = game1.move({ from: 'b8', to: 'c6' });
  assert(Boolean(blackKnight), 'Knight move (b8 -> c6)');

  const rookPawn = game1.move({ from: 'h2', to: 'h4' });
  assert(Boolean(rookPawn), 'White Pawn move (h2 -> h4)');

  const blackDummy = game1.move({ from: 'a7', to: 'a6' });
  assert(Boolean(blackDummy), 'Black move (a7 -> a6)');

  const rookMove = game1.move({ from: 'h1', to: 'h3' });
  assert(Boolean(rookMove), 'Rook move (h1 -> h3)');

  const blackDummy2 = game1.move({ from: 'b7', to: 'b6' });
  assert(Boolean(blackDummy2), 'Black move (b7 -> b6)');

  const kingMove = game1.move({ from: 'e1', to: 'e2' });
  assert(Boolean(kingMove), 'King move (e1 -> e2)');

  // 2. Illegal moves rejected
  console.log('\n--- 2. Illegal Move Rejection ---');
  let illegalCaught = false;
  try {
    const illegalMove = game1.move({ from: 'a8', to: 'a1' }); // Blocked rook
    if (!illegalMove) illegalCaught = true;
  } catch {
    illegalCaught = true;
  }
  assert(illegalCaught, 'Illegal move rejected (blocked rook a8 -> a1)');

  // 3. Captures
  console.log('\n--- 3. Captures ---');
  const capGame = new Chess();
  capGame.move({ from: 'e2', to: 'e4' });
  capGame.move({ from: 'd7', to: 'd5' });
  const capture = capGame.move({ from: 'e4', to: 'd5' });
  assert(Boolean(capture && capture.captured === 'p'), 'Pawn capture (exd5 captures pawn)');

  // 4. Turn changes
  console.log('\n--- 4. Turn Alternation ---');
  const turnGame = new Chess();
  assert(turnGame.turn() === 'w', 'Initial turn is White');
  turnGame.move('e4');
  assert(turnGame.turn() === 'b', 'Turn changes to Black after move');
  turnGame.move('e5');
  assert(turnGame.turn() === 'w', 'Turn changes back to White');

  // 5. Check detection
  console.log('\n--- 5. Check Detection ---');
  const checkGame = new Chess();
  checkGame.move('e4');
  checkGame.move('e5');
  checkGame.move('Qh5');
  checkGame.move('g6');
  checkGame.move('Qxe5+');
  assert(checkGame.isCheck(), 'Check detected after Qxe5+');

  // 6. Checkmate detection
  console.log('\n--- 6. Checkmate Detection (Scholar\'s Mate) ---');
  const mateGame = new Chess();
  mateGame.move('e4');
  mateGame.move('e5');
  mateGame.move('Bc4');
  mateGame.move('Nc6');
  mateGame.move('Qh5');
  mateGame.move('Nf6');
  mateGame.move('Qxf7#');
  assert(mateGame.isCheckmate(), 'Scholar\'s mate triggers isCheckmate()');
  assert(mateGame.isGameOver(), 'Checkmate triggers isGameOver()');

  // 7. Stalemate detection
  console.log('\n--- 7. Stalemate Detection ---');
  // Stalemate position: Black king on a8, White queen on c7, White king on c8 -> Black has no legal moves and is not in check
  const staleGame = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert(staleGame.isStalemate(), 'Stalemate detected in 7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert(staleGame.isDraw(), 'Stalemate is a draw');

  // 8. Castling (Kingside and Queenside)
  console.log('\n--- 8. Castling ---');
  const castleGame = new Chess();
  // Clear path for White kingside castle
  castleGame.move('e4');
  castleGame.move('e5');
  castleGame.move('Nf3');
  castleGame.move('Nc6');
  castleGame.move('Bc4');
  castleGame.move('Bc5');
  const kingsideCastle = castleGame.move({ from: 'e1', to: 'g1' });
  assert(Boolean(kingsideCastle && kingsideCastle.san === 'O-O'), 'Kingside castling (e1 -> g1) works');
  assert(castleGame.get('f1')?.type === 'r', 'Rook moved automatically to f1 during castling');

  // Queenside castle
  const qCastleGame = new Chess();
  qCastleGame.move('d4');
  qCastleGame.move('d5');
  qCastleGame.move('Nc3');
  qCastleGame.move('Nc6');
  qCastleGame.move('Bf4');
  qCastleGame.move('Bf5');
  qCastleGame.move('Qd2');
  qCastleGame.move('Qd7');
  const queensideCastle = qCastleGame.move({ from: 'e1', to: 'c1' });
  assert(Boolean(queensideCastle && queensideCastle.san === 'O-O-O'), 'Queenside castling (e1 -> c1) works');
  assert(qCastleGame.get('d1')?.type === 'r', 'Rook moved automatically to d1 during queenside castling');

  // 9. En Passant
  console.log('\n--- 9. En Passant ---');
  const epGame = new Chess();
  epGame.move('e4');
  epGame.move('a6');
  epGame.move('e5');
  epGame.move('d5'); // Black pawn jumps 2 squares next to White e5 pawn
  const epMove = epGame.move({ from: 'e5', to: 'd6' });
  assert(Boolean(epMove && epMove.captured === 'p'), 'En passant capture (e5 -> d6 captures d5 pawn)');
  assert(!epGame.get('d5'), 'Captured pawn on d5 removed from board');

  // 10. Pawn Promotion
  console.log('\n--- 10. Pawn Promotion ---');
  // Pawn on a7 about to promote to a8
  const promoGame = new Chess('8/P7/8/8/8/8/8/k6K w - - 0 1');
  const promoQueen = promoGame.move({ from: 'a7', to: 'a8', promotion: 'q' });
  assert(Boolean(promoQueen && promoQueen.promotion === 'q'), 'Pawn promotion to Queen (a7 -> a8, promo: q)');
  assert(promoGame.get('a8')?.type === 'q', 'Square a8 contains Queen');

  const promoKnightGame = new Chess('8/P7/8/8/8/8/8/k6K w - - 0 1');
  const promoKnight = promoKnightGame.move({ from: 'a7', to: 'a8', promotion: 'n' });
  assert(Boolean(promoKnight && promoKnight.promotion === 'n'), 'Pawn promotion to Knight (a7 -> a8, promo: n)');
  assert(promoKnightGame.get('a8')?.type === 'n', 'Square a8 contains Knight');

  // 11. Insufficient Material Draw
  console.log('\n--- 11. Insufficient Material ---');
  const imGame = new Chess('8/8/8/8/8/8/4k3/4K3 w - - 0 1'); // King vs King
  assert(imGame.isInsufficientMaterial(), 'King vs King is insufficient material');
  assert(imGame.isDraw(), 'King vs King is a draw');

  const imBishopGame = new Chess('8/8/8/8/8/8/4k3/4KB2 w - - 0 1'); // King+Bishop vs King
  assert(imBishopGame.isInsufficientMaterial(), 'King + Bishop vs King is insufficient material');

  // 12. Threefold Repetition
  console.log('\n--- 12. Threefold Repetition ---');
  const repGame = new Chess();
  repGame.move('Nf3'); repGame.move('Nf6');
  repGame.move('Ng1'); repGame.move('Ng8');
  repGame.move('Nf3'); repGame.move('Nf6');
  repGame.move('Ng1'); repGame.move('Ng8');
  assert(repGame.isThreefoldRepetition(), 'Threefold repetition detected');
  assert(repGame.isDraw(), 'Threefold repetition is a draw');

  // 13. Move History
  console.log('\n--- 13. Move History ---');
  const histGame = new Chess();
  histGame.move('e4');
  histGame.move('e5');
  histGame.move('Nf3');
  const history = histGame.history();
  assert(history.length === 3 && history[0] === 'e4' && history[1] === 'e5' && history[2] === 'Nf3', 'History tracks moves correctly');

  // 14. Reset Game
  console.log('\n--- 14. Reset Game ---');
  histGame.reset();
  assert(histGame.fen() === 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', 'Reset returns to initial FEN');
  assert(histGame.history().length === 0, 'Reset clears move history');

  console.log('\n========================================');
  console.log(`TOTAL TESTS: ${passed + failed}`);
  console.log(`PASSED: ${passed}`);
  console.log(`FAILED: ${failed}`);
  console.log('========================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
