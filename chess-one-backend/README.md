# ChessOne — Live Chess Match Backend

Authoritative, real-time Live Chess Match backend for **ChessOne**, powering mobile player-vs-player matches, invitations, and AI practice.

---

## 1. Architecture Overview

```text
  React Native / Expo Mobile App
        │                   │
        │ REST APIs         │ Socket.IO
        ▼                   ▼
  Express Controllers   Socket Rooms (game:<id>, user:<id>)
        │                   │
        └─────────┬─────────┘
                  │
        Move / Game / Clock Services
                  │
        ┌─────────┴─────────┐
        │                   │
     chess.js            Prisma ORM
  (Move Validation)         │
                            ▼
                    Supabase PostgreSQL
```

### Key Architectural Tenets
1. **Authoritative Backend**: The mobile client is never trusted for move legality, turns, clocks, or game outcomes. All moves are re-validated by the backend using `chess.js` and atomic database transactions.
2. **REST for Actions, Sockets for Real-Time Feeds**:
   - REST endpoints handle match creation, joins, invitations, move submissions, draw offers, resignations, and state queries.
   - Socket.IO broadcasts moves, clock updates, start events, resignations, and connection drops in real time.
3. **Database Durability**: All states, FEN positions, PGN logs, and clock records are stored in PostgreSQL via Prisma. A disconnected client recovers full state via `GET /api/games/:gameId/state`.
4. **Integer IDs**: All primary and foreign keys use standard auto-incrementing integers (`Int`).

---

## 2. Database Models & Relationships

- **User (`id: Int`)**: Players participating in live matches.
- **Game (`id: Int`)**: Live match instance.
  - `gameCode: String` (Unique 6-character code, e.g. `ABC123`).
  - `createdBy: Int` -> Foreign key to `User`.
  - `whitePlayerId: Int?`, `blackPlayerId: Int?` -> Foreign keys to `User`.
  - `status: GameStatus` (`WAITING`, `ACTIVE`, `COMPLETED`, `CANCELLED`).
  - `gameType: GameType` (`PLAYER_VS_PLAYER`, `PLAYER_VS_AI`).
  - `timeControl: String` (e.g. `10+0`, `3+2`).
  - `whiteTimeMs: Int?`, `blackTimeMs: Int?`.
  - `fen: String`, `pgn: String`, `currentTurn: PlayerColor`.
  - `result: GameResult?` (`CHECKMATE`, `RESIGNATION`, `DRAW`, `STALEMATE`, `TIMEOUT`).
  - `winnerId: Int?` -> Foreign key to `User`.
- **GameInvitation (`id: Int`)**:
  - `gameId: Int`, `senderId: Int`, `receiverId: Int`.
  - `status: InvitationStatus` (`PENDING`, `ACCEPTED`, `REJECTED`, `EXPIRED`, `CANCELLED`).
  - `expiresAt: DateTime`, `respondedAt: DateTime?`.
- **GameMove (`id: Int`)**:
  - `gameId: Int`, `moveNumber: Int`, `playerId: Int?`, `color: PlayerColor`.
  - `from: String`, `to: String`, `promotion: String?`, `san: String`, `fenAfter: String`.

---

## 3. Directory Layout

```text
chess-one-backend/
├── src/
│   ├── config/
│   │   ├── env.js            # Environment config with fallbacks
│   │   ├── database.js       # Prisma client instance
│   │   ├── prisma.js         # Prisma 7 adapter configuration
│   │   └── socket.js         # Global Socket.IO reference & emitters
│   ├── controllers/
│   │   ├── game.controller.js
│   │   └── invitation.controller.js
│   ├── routes/
│   │   ├── auth.routes.js        # Dev token / login helper routes
│   │   ├── game.routes.js        # /api/games endpoints
│   │   └── invitation.routes.js  # /api/invitations endpoints
│   ├── services/
│   │   ├── game.service.js       # Game lifecycle, state, resignations, draws
│   │   ├── move.service.js       # Authoritative move validation & transactions
│   │   ├── invitation.service.js # Invitations & atomic game starts
│   │   ├── clock.service.js      # Authoritative chess clock calculations
│   │   ├── result.service.js     # Checkmate, stalemate, draw & timeout rules
│   │   └── ai.service.js         # Pluggable AI interface (Stockfish-ready)
│   ├── socket/
│   │   ├── index.js              # Socket.IO setup & authentication
│   │   └── game.socket.js        # Room joins, disconnect & reconnect
│   ├── validators/
│   │   ├── game.validator.js     # Zod schemas for game & move inputs
│   │   └── invitation.validator.js
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT & dev authentication
│   │   └── error.middleware.js   # Centralized error handler & AppError
│   ├── utils/
│   │   ├── game-code.js          # Unique 6-character code generator
│   │   ├── chess.js              # chess.js wrapper & FEN/PGN utilities
│   │   └── response.js           # Standard JSON response formatting
│   ├── app.js                    # Express app definition
│   ├── server.js                 # HTTP + Socket.IO server entry
│   ├── seed.js                   # Test user seed script
│   └── test-live-match.js        # Full automated test suite
├── prisma/
│   └── schema.prisma             # PostgreSQL schema with integer IDs
├── .env.example
├── package.json
└── README.md
```

---

## 4. REST API Reference

All protected endpoints accept either:
- Header `Authorization: Bearer <JWT>`
- Header `x-user-id: <integer>` (Development testing helper)

### Health Check
```http
GET /health
```
```json
{
  "success": true,
  "message": "ChessOne backend is running"
}
```

---

### Authentication (Development)
```http
POST /api/auth/dev-login
Content-Type: application/json

{ "userId": 1 }
```
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "user": { "id": 1, "name": "Player One", "email": "player1@chessone.local" }
}
```

---

### Create Game
```http
POST /api/games
Authorization: Bearer <token>
Content-Type: application/json

{
  "gameType": "PLAYER_VS_PLAYER",
  "timeControl": "10+0",
  "colorPreference": "WHITE"
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "game": {
    "gameId": 1,
    "gameCode": "ABC123",
    "gameType": "PLAYER_VS_PLAYER",
    "status": "WAITING",
    "playerColor": "WHITE",
    "timeControl": "10+0"
  }
}
```

---

### Invite Player
```http
POST /api/games/:gameId/invite
Authorization: Bearer <token>
Content-Type: application/json

{
  "opponentUserId": 2
}
```
```json
{
  "success": true,
  "invitation": {
    "id": 1,
    "gameId": 1,
    "gameCode": "ABC123",
    "status": "PENDING",
    "receiverId": 2,
    "expiresAt": "2026-10-07T06:00:00.000Z"
  }
}
```

---

### Get Pending Invitations
```http
GET /api/invitations
Authorization: Bearer <token>
```
```json
{
  "success": true,
  "invitations": [
    {
      "id": 1,
      "gameId": 1,
      "gameCode": "ABC123",
      "sender": { "id": 1, "name": "Player One", "email": "player1@chessone.local" },
      "timeControl": "10+0",
      "createdAt": "2026-10-07T05:45:00.000Z",
      "expiresAt": "2026-10-07T06:00:00.000Z"
    }
  ]
}
```

---

### Accept Invitation
```http
POST /api/invitations/:invitationId/accept
Authorization: Bearer <token>
```
```json
{
  "success": true,
  "game": {
    "gameId": 1,
    "gameCode": "ABC123",
    "status": "ACTIVE",
    "playerColor": "BLACK"
  }
}
```
*Emits `game:started` to the game room.*

---

### Submit Move
```http
POST /api/games/:gameId/moves
Authorization: Bearer <token>
Content-Type: application/json

{
  "from": "e2",
  "to": "e4",
  "promotion": "q"
}
```
```json
{
  "success": true,
  "move": {
    "id": 1,
    "moveNumber": 1,
    "playerId": 1,
    "color": "WHITE",
    "from": "e2",
    "to": "e4",
    "san": "e4",
    "fenAfter": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1"
  },
  "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
  "currentTurn": "BLACK",
  "whiteTimeMs": 600000,
  "blackTimeMs": 600000,
  "status": "ACTIVE",
  "result": null,
  "winnerId": null
}
```

---

### Get Game State (Reconnection)
```http
GET /api/games/:gameId/state
Authorization: Bearer <token>
```
```json
{
  "success": true,
  "game": {
    "gameId": 1,
    "gameCode": "ABC123",
    "status": "ACTIVE",
    "fen": "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq - 0 1",
    "currentTurn": "BLACK",
    "whiteTimeMs": 598000,
    "blackTimeMs": 600000,
    "lastMoveAt": "2026-10-07T05:46:12.000Z",
    "result": null,
    "winnerId": null
  }
}
```

---

### Resign Game
```http
POST /api/games/:gameId/resign
Authorization: Bearer <token>
```
```json
{
  "success": true,
  "gameId": 1,
  "gameCode": "ABC123",
  "result": "RESIGNATION",
  "resignedBy": 2,
  "winnerId": 1
}
```

---

### Draw Actions
- `POST /api/games/:gameId/draw-offer` -> Emits `game:draw-offered`
- `POST /api/games/:gameId/draw-accept` -> Completes game with `result: DRAW`
- `POST /api/games/:gameId/draw-reject` -> Clears offer and emits `game:draw-rejected`

---

### Move History, PGN & Result
- `GET /api/games/:gameId/moves` -> Ordered list of played moves.
- `GET /api/games/:gameId/pgn` -> Full standard PGN notation string.
- `GET /api/games/:gameId/result` -> Winner, loser, final FEN, PGN, completion time.
- `GET /api/games/my-games?status=ACTIVE&page=1&limit=20` -> Paginated player history.

---

## 5. Socket.IO Events

### Client to Server
| Event | Payload | Description |
|---|---|---|
| `game:join` | `{ "gameId": 1 }` or `{ "gameId": "ABC123" }` | Joins live game room |

### Server to Client
| Event | Room | Payload Details |
|---|---|---|
| `game:started` | `game:<id>` | Game metadata, players, clocks |
| `game:move` | `game:<id>` | Move details, `san`, `fenAfter`, next turn, clocks |
| `game:finished` | `game:<id>` | `result` (`CHECKMATE`, `RESIGNATION`, `DRAW`, `TIMEOUT`), `winnerId` |
| `game:draw-offered` | `game:<id>` | `offeredByColor`, `offeredByUserId` |
| `game:draw-accepted` | `game:<id>` | `result: DRAW` |
| `game:draw-rejected` | `game:<id>` | `rejectedByUserId` |
| `game:resigned` | `game:<id>` | `resignedBy`, `winnerId` |
| `game:player-disconnected` | `game:<id>` | `userId`, `socketId` |
| `game:player-reconnected` | `game:<id>` | `userId`, `socketId` |
| `invitation:received` | `user:<id>` | Private notification to invited player |

---

## 6. How to Run & Test

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and configure your database strings. Set
`OPENROUTER_API_KEY` to enable AI game reviews:
```bash
cp .env.example .env
```

### 3. Run Database Sync & Seed
```bash
npx prisma db push
npm run seed
```

### 4. Run Automated End-to-End Test Suite
```bash
npm test
```
The test suite validates all 19 phases of the Live Match module:
- PvP match creation
- Invitations & acceptance
- Socket.IO connection & real-time move delivery
- Turn & chess rule validation guards
- Draw offer & rejection
- Resignation & results
- Player vs AI match creation & AI response
- Checkmate (Fool's Mate) detection
