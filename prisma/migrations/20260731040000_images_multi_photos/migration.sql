-- ============================================================
-- Photos multiples pour les posts et les événements.
-- Expand / backfill / contract : les anciennes valeurs de
-- Post.imageUrl sont migrées vers PostImage avant suppression
-- de la colonne (aucune perte de données).
-- ============================================================

-- ---------- 1. Nouvelles tables ----------
CREATE TABLE "PostImage" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PostImage_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "PostImage" ADD CONSTRAINT "PostImage_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "EvenementImage" (
    "id" TEXT NOT NULL,
    "evenementId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "ordre" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EvenementImage_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "EvenementImage" ADD CONSTRAINT "EvenementImage_evenementId_fkey" FOREIGN KEY ("evenementId") REFERENCES "Evenement"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------- 2. Backfill : ancien Post.imageUrl -> PostImage ----------
INSERT INTO "PostImage" ("id", "postId", "url", "ordre")
SELECT gen_random_uuid()::text, "id", "imageUrl", 0
FROM "Post"
WHERE "imageUrl" IS NOT NULL;

-- ---------- 3. Contract : supprimer l'ancienne colonne ----------
ALTER TABLE "Post" DROP COLUMN "imageUrl";
