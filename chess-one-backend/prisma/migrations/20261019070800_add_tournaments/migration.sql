-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('ROUND_ROBIN', 'SWISS');

-- CreateEnum
CREATE TYPE "TournamentStatus" AS ENUM ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RoundStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "tournamentId" INTEGER;

-- CreateTable
CREATE TABLE "Tournament" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "format" "TournamentFormat" NOT NULL DEFAULT 'ROUND_ROBIN',
    "timeControl" TEXT NOT NULL,
    "totalRounds" INTEGER,
    "maxPlayers" INTEGER NOT NULL DEFAULT 16,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "status" "TournamentStatus" NOT NULL DEFAULT 'UPCOMING',
    "currentRound" INTEGER NOT NULL DEFAULT 0,
    "isRated" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" INTEGER NOT NULL,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentPlayer" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "score" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tiebreak" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hadBye" BOOLEAN NOT NULL DEFAULT false,
    "withdrawn" BOOLEAN NOT NULL DEFAULT false,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TournamentPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentRound" (
    "id" SERIAL NOT NULL,
    "tournamentId" INTEGER NOT NULL,
    "roundNumber" INTEGER NOT NULL,
    "status" "RoundStatus" NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),

    CONSTRAINT "TournamentRound_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentPairing" (
    "id" SERIAL NOT NULL,
    "roundId" INTEGER NOT NULL,
    "boardNumber" INTEGER NOT NULL,
    "whiteId" INTEGER NOT NULL,
    "blackId" INTEGER,
    "gameId" INTEGER,
    "result" TEXT,

    CONSTRAINT "TournamentPairing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tournament_status_startsAt_idx" ON "Tournament"("status", "startsAt");

-- CreateIndex
CREATE INDEX "Tournament_createdBy_idx" ON "Tournament"("createdBy");

-- CreateIndex
CREATE INDEX "TournamentPlayer_userId_idx" ON "TournamentPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPlayer_tournamentId_userId_key" ON "TournamentPlayer"("tournamentId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentRound_tournamentId_roundNumber_key" ON "TournamentRound"("tournamentId", "roundNumber");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentPairing_gameId_key" ON "TournamentPairing"("gameId");

-- CreateIndex
CREATE INDEX "TournamentPairing_roundId_idx" ON "TournamentPairing"("roundId");

-- CreateIndex
CREATE INDEX "Game_tournamentId_idx" ON "Game"("tournamentId");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPlayer" ADD CONSTRAINT "TournamentPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentRound" ADD CONSTRAINT "TournamentRound_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPairing" ADD CONSTRAINT "TournamentPairing_roundId_fkey" FOREIGN KEY ("roundId") REFERENCES "TournamentRound"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentPairing" ADD CONSTRAINT "TournamentPairing_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE SET NULL ON UPDATE CASCADE;
