-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'COACH', 'SCHOOL', 'ORGANISER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fideId" TEXT,
ADD COLUMN     "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "level" TEXT,
ADD COLUMN     "onboardingDone" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "rating" INTEGER NOT NULL DEFAULT 1200,
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'STUDENT',
ADD COLUMN     "school" TEXT,
ADD COLUMN     "schoolClass" TEXT;

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "blackRatingChange" INTEGER,
ADD COLUMN     "ratingApplied" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "whiteRatingChange" INTEGER;

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
