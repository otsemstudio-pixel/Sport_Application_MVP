-- Suivi de mensurations : purement additif (nouvelle colonne avec
-- défaut, nouvelle table), aucune transformation de données requise.

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN     "suiviMensurationsActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Mensuration" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "poidsKg" DOUBLE PRECISION,
    "tailleCm" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mensuration_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Mensuration" ADD CONSTRAINT "Mensuration_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
