const fs = require('fs');
let c = fs.readFileSync('src/app/game/[gameId].tsx', 'utf8');

c = c.replace(
  /if \(status !== 'ACTIVE'\) return;\r?\n\r?\n\s*if \(connectionStatus === 'disconnected'\) \{/,
  "if (status !== 'ACTIVE') return;\n    if (game?.gameType === 'PLAYER_VS_AI') return;\n\n    if (connectionStatus === 'disconnected') {"
);

c = c.replace(
  /}, \[connectionStatus, status\]\);/,
  "}, [connectionStatus, status, game?.gameType]);"
);

fs.writeFileSync('src/app/game/[gameId].tsx', c);
