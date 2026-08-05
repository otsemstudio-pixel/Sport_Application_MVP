-- Système d'engagement quotidien (séries, XP, ligues hebdomadaires,
-- notifications push, résumé hebdomadaire) — entièrement additif, aucune
-- perte de données. La série (streak) elle-même n'a pas de table dédiée :
-- elle est recalculée à la volée depuis SeanceEntrainement, PreferenceAssiduite
-- et JokerAssiduite (voir lib/assiduite.ts), jamais stockée.

-- CreateEnum
CREATE TYPE "PreferenceNotifications" AS ENUM ('DESACTIVE', 'QUOTIDIEN', 'QUELQUES_FOIS_SEMAINE');

-- CreateEnum
CREATE TYPE "TypeEvenementXp" AS ENUM ('SEANCE_COMPLETEE', 'DEFI_DUJOUR', 'REPOS_PLANIFIE_RESPECTE', 'OBJECTIF_ATTEINT', 'RECORD_PERSONNEL', 'BADGE_DEBLOQUE', 'INSCRIPTION_TOURNOI', 'RESULTAT_TOURNOI');

-- CreateEnum
CREATE TYPE "MouvementLigue" AS ENUM ('PROMOTION', 'RELEGATION', 'STABLE');

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN "xpTotal" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "preferenceNotifications" "PreferenceNotifications" NOT NULL DEFAULT 'DESACTIVE',
ADD COLUMN "derniereSemaineResumeVue" TEXT;

-- CreateTable
CREATE TABLE "PreferenceAssiduite" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "joursReposPlanifies" INTEGER[],
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PreferenceAssiduite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JokerAssiduite" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "dateCouverte" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JokerAssiduite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvenementXp" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "type" "TypeEvenementXp" NOT NULL,
    "montant" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EvenementXp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigueGroupe" (
    "id" TEXT NOT NULL,
    "semaine" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "niveau" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LigueGroupe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigueMembre" (
    "id" TEXT NOT NULL,
    "groupeId" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "xpSemaine" INTEGER NOT NULL DEFAULT 0,
    "rangFinal" INTEGER,
    "mouvement" "MouvementLigue",

    CONSTRAINT "LigueMembre_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AbonnementNotification" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AbonnementNotification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PreferenceAssiduite_athleteId_key" ON "PreferenceAssiduite"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "JokerAssiduite_athleteId_dateCouverte_key" ON "JokerAssiduite"("athleteId", "dateCouverte");

-- CreateIndex
CREATE INDEX "EvenementXp_athleteId_createdAt_idx" ON "EvenementXp"("athleteId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "LigueGroupe_semaine_ville_sportId_niveau_key" ON "LigueGroupe"("semaine", "ville", "sportId", "niveau");

-- CreateIndex
CREATE UNIQUE INDEX "LigueMembre_groupeId_athleteId_key" ON "LigueMembre"("groupeId", "athleteId");

-- CreateIndex
CREATE INDEX "LigueMembre_athleteId_idx" ON "LigueMembre"("athleteId");

-- CreateIndex
CREATE UNIQUE INDEX "AbonnementNotification_endpoint_key" ON "AbonnementNotification"("endpoint");

-- AddForeignKey
ALTER TABLE "PreferenceAssiduite" ADD CONSTRAINT "PreferenceAssiduite_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JokerAssiduite" ADD CONSTRAINT "JokerAssiduite_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvenementXp" ADD CONSTRAINT "EvenementXp_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigueGroupe" ADD CONSTRAINT "LigueGroupe_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigueMembre" ADD CONSTRAINT "LigueMembre_groupeId_fkey" FOREIGN KEY ("groupeId") REFERENCES "LigueGroupe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigueMembre" ADD CONSTRAINT "LigueMembre_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AbonnementNotification" ADD CONSTRAINT "AbonnementNotification_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
