-- Phase 2/2 : verrouille nomUtilisateur en NOT NULL + UNIQUE une fois le
-- backfill des comptes existants terminé.

-- AlterTable
ALTER TABLE "Athlete" ALTER COLUMN "nomUtilisateur" SET NOT NULL;

-- AlterTable
ALTER TABLE "Organisateur" ALTER COLUMN "nomUtilisateur" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Athlete_nomUtilisateur_key" ON "Athlete"("nomUtilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "Organisateur_nomUtilisateur_key" ON "Organisateur"("nomUtilisateur");
