-- ============================================================
-- Refonte du module d'entraînement : Exercice/SeanceEntrainement/
-- ExerciceRealise remplacent Defi/Seance. Expand / backfill /
-- contract pour préserver les données existantes.
--
-- NOTE D'APPLICATION : l'étape 0 (ALTER TYPE ... ADD VALUE) doit
-- être exécutée seule, hors transaction — Postgres interdit
-- d'utiliser une valeur d'enum tout juste ajoutée dans la même
-- transaction. Le reste (étapes 1+) s'exécute dans une transaction
-- séparée.
-- ============================================================

-- ---------- 0. Nouvelle valeur d'enum (hors transaction) ----------
ALTER TYPE "CategoriePerformance" ADD VALUE IF NOT EXISTS 'RENFORCEMENT_GENERAL';

-- ============================================================
-- (transaction séparée à partir d'ici)
-- ============================================================

-- ---------- 1. Nouveaux types et tables ----------
CREATE TYPE "UniteMesure" AS ENUM ('REPETITIONS', 'DUREE_SECONDES', 'DISTANCE_METRES', 'SERIES_X_REPETITIONS');

CREATE TABLE "Exercice" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoriePerformance" "CategoriePerformance" NOT NULL,
    "uniteMesure" "UniteMesure" NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Exercice_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Exercice_nom_key" ON "Exercice"("nom");

CREATE TABLE "SeanceEntrainement" (
    "id" TEXT NOT NULL,
    "athleteId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "noteOptionnelle" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeanceEntrainement_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "SeanceEntrainement" ADD CONSTRAINT "SeanceEntrainement_athleteId_fkey" FOREIGN KEY ("athleteId") REFERENCES "Athlete"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ExerciceRealise" (
    "id" TEXT NOT NULL,
    "seanceId" TEXT NOT NULL,
    "exerciceId" TEXT NOT NULL,
    "valeur" DOUBLE PRECISION NOT NULL,
    "series" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExerciceRealise_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "ExerciceRealise" ADD CONSTRAINT "ExerciceRealise_seanceId_fkey" FOREIGN KEY ("seanceId") REFERENCES "SeanceEntrainement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ExerciceRealise" ADD CONSTRAINT "ExerciceRealise_exerciceId_fkey" FOREIGN KEY ("exerciceId") REFERENCES "Exercice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- 2. Post : lien optionnel vers une séance partagée ----------
ALTER TABLE "Post" ADD COLUMN "seanceEntrainementId" TEXT;
ALTER TABLE "Post" ADD CONSTRAINT "Post_seanceEntrainementId_fkey" FOREIGN KEY ("seanceEntrainementId") REFERENCES "SeanceEntrainement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- ---------- 3. Backfill Defi -> Exercice ----------
INSERT INTO "Exercice" ("id", "nom", "categoriePerformance", "uniteMesure", "description")
SELECT
  d."id",
  d."nom",
  COALESCE(d."categoriePerformance", s."categoriePerformance"),
  CASE
    WHEN d."unite" ILIKE '%seconde%' OR d."unite" ILIKE '%minute%' THEN 'DUREE_SECONDES'
    WHEN d."unite" ILIKE '%metre%' OR d."unite" ILIKE '%mètre%' OR d."unite" ILIKE '%km%' THEN 'DISTANCE_METRES'
    ELSE 'REPETITIONS'
  END::"UniteMesure",
  d."description"
FROM "Defi" d
LEFT JOIN "Sport" s ON s."id" = d."sportId";

-- ---------- 4. Backfill Seance -> SeanceEntrainement + ExerciceRealise ----------
INSERT INTO "SeanceEntrainement" ("id", "athleteId", "date")
SELECT "id", "athleteId", "date" FROM "Seance";

INSERT INTO "ExerciceRealise" ("id", "seanceId", "exerciceId", "valeur")
SELECT gen_random_uuid()::text, s."id", s."defiId", s."valeurMesuree"
FROM "Seance" s;

-- ---------- 5. Contract : suppression des anciennes tables ----------
DROP TABLE "Seance";
DROP TABLE "Defi";
