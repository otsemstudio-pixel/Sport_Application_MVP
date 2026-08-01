-- Thème adaptatif, onboarding actionnable, mascotte scriptée : purement
-- additif (nouvelles colonnes avec défaut, nouvelle table), aucune
-- transformation de données existantes.

-- CreateEnum
CREATE TYPE "PreferenceEffets" AS ENUM ('AUTO', 'DEGRADE', 'COMPLET');

-- CreateEnum
CREATE TYPE "ThemeFond" AS ENUM ('CLAIR', 'SOMBRE', 'SPORT');

-- CreateEnum
CREATE TYPE "RessentiSeance" AS ENUM ('DIFFICILE', 'CORRECT', 'FACILE');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "onboardingComplete" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "preferenceEffetsVisuels" "PreferenceEffets" NOT NULL DEFAULT 'AUTO',
ADD COLUMN     "themeFond" "ThemeFond" NOT NULL DEFAULT 'CLAIR';

-- AlterTable
ALTER TABLE "Exercice" ADD COLUMN     "beneficePerformance" TEXT;

-- CreateTable
CREATE TABLE "RetourSeance" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "ressenti" "RessentiSeance" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RetourSeance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RetourSeance_seanceId_key" ON "RetourSeance"("seanceId");

-- AddForeignKey
ALTER TABLE "RetourSeance" ADD CONSTRAINT "RetourSeance_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "SeanceEntrainement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
