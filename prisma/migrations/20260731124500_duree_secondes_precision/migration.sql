-- Sprint 30m et exercices similaires ont des temps avec décimales
-- (ex. 4.8 secondes) : INTEGER perdait cette précision. Élargissement
-- sûr vers DOUBLE PRECISION, aucune perte de données existantes.
ALTER TABLE "Serie" ALTER COLUMN "dureeSecondes" TYPE DOUBLE PRECISION;
ALTER TABLE "ProgrammeExercice" ALTER COLUMN "dureePrevueSecondes" TYPE DOUBLE PRECISION;
