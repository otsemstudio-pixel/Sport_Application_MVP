-- ============================================================
-- Séries détaillées, records personnels, objectifs, programmes
-- d'entraînement. Expand / backfill / contract pour préserver
-- les données existantes (ExerciceRealise.valeur/series ->
-- Serie).
--
-- Contrairement à la migration précédente, aucune valeur d'enum
-- n'est ajoutée à un type existant (uniquement de nouveaux types
-- CREATE TYPE) : toute la migration peut s'exécuter dans une
-- seule transaction.
-- ============================================================

-- ---------- 1. Nouveaux types ----------
CREATE TYPE "SensAmelioration" AS ENUM ('PLUS_HAUT_MIEUX', 'PLUS_BAS_MIEUX');
CREATE TYPE "StatutProgramme" AS ENUM ('EN_COURS', 'TERMINE', 'ABANDONNE');

-- ---------- 2. Exercice : sens d'amélioration ----------
ALTER TABLE "Exercice" ADD COLUMN "sensAmelioration" "SensAmelioration" NOT NULL DEFAULT 'PLUS_HAUT_MIEUX';

-- Exercices "contre la montre" où une valeur plus basse = progrès.
UPDATE "Exercice" SET "sensAmelioration" = 'PLUS_BAS_MIEUX'
WHERE "nom" IN ('Sprint 30m chronométré', '10 km chronométré', '5 km chronométré', 'Mouvements de lutte au sol chronométrés');

-- SERIES_X_REPETITIONS n'apporte plus rien au-delà de REPETITIONS
-- maintenant que les séries sont suivies nativement (table Serie).
UPDATE "Exercice" SET "uniteMesure" = 'REPETITIONS' WHERE "uniteMesure" = 'SERIES_X_REPETITIONS';

-- ---------- 3. Nouvelles tables ----------
CREATE TABLE "Serie" (
    "id" TEXT NOT NULL,
    "exerciceRealiseId" TEXT NOT NULL,
    "numeroSerie" INTEGER NOT NULL,
    "repetitions" INTEGER,
    "poidsKg" DOUBLE PRECISION,
    "dureeSecondes" INTEGER,
    "distanceMetres" DOUBLE PRECISION,
    "tempsReposSecondes" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Serie_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RecordPersonnel" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "dateRealisation" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecordPersonnel_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "RecordPersonnel_athleteId_exerciceId_key" ON "RecordPersonnel"("athleteId", "exerciceId");

CREATE TABLE "Objectif" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "valeurCible" DOUBLE PRECISION NOT NULL,
    "dateLimite" TIMESTAMP(3),
    "atteint" BOOLEAN NOT NULL DEFAULT false,
    "dateAtteint" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Objectif_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Programme" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dureeSemaines" INTEGER NOT NULL,
    "categoriePerformance" "CategoriePerformance",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Programme_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgrammeSeance" (
    "id" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "numeroSemaine" INTEGER NOT NULL,
    "numeroJour" INTEGER NOT NULL,
    "nomSeance" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgrammeSeance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProgrammeExercice" (
    "id" TEXT NOT NULL,
    "programmeSeanceId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "seriesPrevues" INTEGER,
    "repetitionsPrevues" INTEGER,
    "dureePrevueSecondes" INTEGER,
    "distancePrevueMetres" DOUBLE PRECISION,
    "poidsPrevuKg" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProgrammeExercice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AthleteProgramme" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "programmeId" TEXT NOT NULL,
    "dateDebut" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "StatutProgramme" NOT NULL DEFAULT 'EN_COURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AthleteProgramme_pkey" PRIMARY KEY ("id")
);

-- ---------- 4. SeanceEntrainement : lien optionnel vers une séance de programme ----------
ALTER TABLE "SeanceEntrainement" ADD COLUMN "programmeSeanceId" TEXT;

-- ---------- 5. Clés étrangères ----------
ALTER TABLE "Serie" ADD CONSTRAINT "Serie_exerciceRealiseId_fkey" FOREIGN KEY ("exerciceRealiseId") REFERENCES "ExerciceRealise"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecordPersonnel" ADD CONSTRAINT "RecordPersonnel_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "RecordPersonnel" ADD CONSTRAINT "RecordPersonnel_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Objectif" ADD CONSTRAINT "Objectif_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Objectif" ADD CONSTRAINT "Objectif_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgrammeSeance" ADD CONSTRAINT "ProgrammeSeance_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgrammeExercice" ADD CONSTRAINT "ProgrammeExercice_programmeSeanceId_fkey" FOREIGN KEY ("programmeSeanceId") REFERENCES "ProgrammeSeance"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProgrammeExercice" ADD CONSTRAINT "ProgrammeExercice_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteProgramme" ADD CONSTRAINT "AthleteProgramme_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "AthleteProgramme" ADD CONSTRAINT "AthleteProgramme_programmeId_fkey" FOREIGN KEY ("programmeId") REFERENCES "Programme"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeanceEntrainement" ADD CONSTRAINT "SeanceEntrainement_programmeSeanceId_fkey" FOREIGN KEY ("programmeSeanceId") REFERENCES "ProgrammeSeance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- 6. Backfill : chaque ExerciceRealise existant devient une unique Serie n°1 ----------
INSERT INTO "Serie" ("id", "exerciceRealiseId", "numeroSerie", "repetitions", "dureeSecondes", "distanceMetres", "createdAt")
SELECT
  gen_random_uuid()::text,
  er."id",
  1,
  CASE WHEN e."uniteMesure" = 'REPETITIONS' THEN er."valeur"::int ELSE NULL END,
  CASE WHEN e."uniteMesure" = 'DUREE_SECONDES' THEN er."valeur"::int ELSE NULL END,
  CASE WHEN e."uniteMesure" = 'DISTANCE_METRES' THEN er."valeur" ELSE NULL END,
  er."createdAt"
FROM "ExerciceRealise" er
JOIN "Exercice" e ON e."id" = er."exerciceId";

-- ---------- 7. Contract : ExerciceRealise devient un conteneur pur ----------
ALTER TABLE "ExerciceRealise" DROP COLUMN "valeur";
ALTER TABLE "ExerciceRealise" DROP COLUMN "series";
