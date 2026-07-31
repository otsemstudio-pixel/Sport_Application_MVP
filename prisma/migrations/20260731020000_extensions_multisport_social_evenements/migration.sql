-- ============================================================
-- Extensions : multi-sport relationnel, fil social, conditions
-- de participation aux événements.
-- Migration en pattern expand / backfill / contract pour
-- préserver les données existantes (aucun DROP destructeur
-- avant d'avoir migré les valeurs).
-- ============================================================

-- ---------- 1. Enums ----------
CREATE TYPE "CategoriePerformance" AS ENUM ('EXPLOSIVITE_PUISSANCE', 'ENDURANCE', 'COLLECTIF_TACTIQUE', 'COMBAT');
CREATE TYPE "NiveauRequis" AS ENUM ('DEBUTANT', 'INTERMEDIAIRE', 'AVANCE', 'TOUS_NIVEAUX');

-- ---------- 2. Nouvelles tables (sans impact sur les données existantes) ----------
CREATE TABLE "Sport" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "categoriePerformance" "CategoriePerformance" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Sport_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Sport_nom_key" ON "Sport"("nom");

CREATE TABLE "Post" (
    "id" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "contenu" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PostLike" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostLike_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PostLike_postId_auteurId_auteurType_key" ON "PostLike"("postId", "auteurId", "auteurType");
ALTER TABLE "PostLike" ADD CONSTRAINT "PostLike_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PostCommentaire" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostCommentaire_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PostCommentaire" ADD CONSTRAINT "PostCommentaire_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- 3. Référentiel Sport ----------
INSERT INTO "Sport" ("id", "nom", "categoriePerformance") VALUES
  (gen_random_uuid()::text, 'Football', 'COLLECTIF_TACTIQUE'),
  (gen_random_uuid()::text, 'Basketball', 'COLLECTIF_TACTIQUE'),
  (gen_random_uuid()::text, 'Athlétisme (sprint/sauts)', 'EXPLOSIVITE_PUISSANCE'),
  (gen_random_uuid()::text, 'Handball', 'COLLECTIF_TACTIQUE'),
  (gen_random_uuid()::text, 'Volleyball', 'COLLECTIF_TACTIQUE'),
  (gen_random_uuid()::text, 'Rugby à 7', 'COLLECTIF_TACTIQUE'),
  (gen_random_uuid()::text, 'Cyclisme sur piste', 'EXPLOSIVITE_PUISSANCE'),
  (gen_random_uuid()::text, 'Athlétisme (fond/demi-fond)', 'ENDURANCE'),
  (gen_random_uuid()::text, 'Cyclisme sur route', 'ENDURANCE'),
  (gen_random_uuid()::text, 'Natation', 'ENDURANCE'),
  (gen_random_uuid()::text, 'Lutte sénégalaise', 'COMBAT'),
  (gen_random_uuid()::text, 'Dambe (boxe traditionnelle nigériane)', 'COMBAT'),
  (gen_random_uuid()::text, 'Judo', 'COMBAT'),
  (gen_random_uuid()::text, 'Taekwondo', 'COMBAT'),
  (gen_random_uuid()::text, 'Boxe', 'COMBAT');

-- ---------- 4. Expand : nouvelles colonnes nullable ----------
ALTER TABLE "Athlete" ADD COLUMN "sportPrincipalId" TEXT;
ALTER TABLE "Defi" ADD COLUMN "sportId" TEXT;
ALTER TABLE "Defi" ADD COLUMN "categoriePerformance" "CategoriePerformance";
ALTER TABLE "Evenement" ADD COLUMN "sportId" TEXT;
ALTER TABLE "Evenement" ADD COLUMN "description" TEXT;
ALTER TABLE "Evenement" ADD COLUMN "niveauRequis" "NiveauRequis";
ALTER TABLE "Evenement" ADD COLUMN "clubRequis" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Evenement" ADD COLUMN "ageMin" INTEGER;
ALTER TABLE "Evenement" ADD COLUMN "ageMax" INTEGER;
ALTER TABLE "Evenement" ADD COLUMN "nombreEquipesMax" INTEGER;
ALTER TABLE "Evenement" ADD COLUMN "equipementFourni" TEXT;
ALTER TABLE "Evenement" ADD COLUMN "fraisInscription" INTEGER NOT NULL DEFAULT 0;

-- ---------- 5. Backfill à partir des anciennes colonnes texte ----------
UPDATE "Athlete" a SET "sportPrincipalId" = s."id"
  FROM "Sport" s WHERE lower(s."nom") = lower(a."sport");

UPDATE "Defi" d SET "sportId" = s."id"
  FROM "Sport" s WHERE lower(s."nom") = lower(d."sport");

UPDATE "Evenement" e SET
  "sportId" = s."id",
  "description" = 'Description à compléter.',
  "niveauRequis" = 'TOUS_NIVEAUX'
  FROM "Sport" s WHERE lower(s."nom") = lower(e."sport");

-- ---------- 6. Contract : rendre obligatoire + supprimer les anciennes colonnes ----------
ALTER TABLE "Athlete" ALTER COLUMN "sportPrincipalId" SET NOT NULL;
ALTER TABLE "Athlete" DROP COLUMN "sport";
ALTER TABLE "Athlete" ADD CONSTRAINT "Athlete_sportPrincipalId_fkey" FOREIGN KEY ("sportPrincipalId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Defi" DROP COLUMN "sport";
ALTER TABLE "Defi" ADD CONSTRAINT "Defi_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Evenement" ALTER COLUMN "sportId" SET NOT NULL;
ALTER TABLE "Evenement" ALTER COLUMN "description" SET NOT NULL;
ALTER TABLE "Evenement" ALTER COLUMN "niveauRequis" SET NOT NULL;
ALTER TABLE "Evenement" DROP COLUMN "sport";
ALTER TABLE "Evenement" ADD CONSTRAINT "Evenement_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
