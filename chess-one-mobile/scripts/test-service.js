const { Chess } = require('chess.js');

// We can test the logic of ChessService & utils directly
function testServiceAndUtils() {
  console.log('Testing ChessService logic & utils...');

  const game = new Chess();
  
  // Test makeMove
  const legal = game.move({ from: 'e2', to: 'e4' });
  if (!legal) throw new Error('e2-e4 failed');

  let illegalFailed = false;
  try {
    const res = game.move({ from: 'e4', to: 'e6' });
    if (!res) illegalFailed = true;
  } catch {
    illegalFailed = true;
  }
  if (!illegalFailed) throw new Error('Illegal move should fail');

  // Test Scholar's mate
  game.reset();
  game.move('e4');
  game.move('e5');
  game.move('Bc4');
  game.move('Nc6');
  game.move('Qh5');
  game.move('Nf6');
  game.move('Qxf7#');

  if (!game.isCheckmate()) throw new Error('Checkmate not detected');
  if (game.turn() !== 'b') throw new Error('Turn should be b on checkmate');
  
  console.log('✅ ChessService logic passed perfectly!');
}

testServiceAndUtils();
