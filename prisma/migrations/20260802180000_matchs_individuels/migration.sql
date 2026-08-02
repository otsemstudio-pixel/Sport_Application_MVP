-- Couverture "en direct" adaptée aux sports individuels : un match de type
-- EQUIPE (score classique) ne représente pas un duel de combat ni une course
-- à plusieurs concurrents. Purement additif.

-- CreateEnum
CREATE TYPE "TypeMatch" AS ENUM ('EQUIPE', 'DUEL', 'COURSE');

-- AlterTable
ALTER TABLE "MatchDemo" ADD COLUMN     "type" "TypeMatch" NOT NULL DEFAULT 'EQUIPE',
ADD COLUMN     "statutTexte" TEXT;

-- CreateTable
CREATE TABLE "MatchParticipant" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "nom" TEXT NOT NULL,
    "resultat" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MatchParticipant_matchId_idx" ON "MatchParticipant"("matchId");

-- AddForeignKey
ALTER TABLE "MatchParticipant" ADD CONSTRAINT "MatchParticipant_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "MatchDemo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
