-- Remplace le menu Actualités (articles éditoriaux de démo + scores en
-- direct fictifs) par un fil "Actualités & Opportunités" alimenté par de
-- vraies sources externes (NewsData.io + flux RSS) via un job cron —
-- décision explicite : le contenu précédent est abandonné, pas conservé en
-- parallèle.

-- DropForeignKey (dans l'ordre de dépendance)
ALTER TABLE "MatchParticipant" DROP CONSTRAINT IF EXISTS "MatchParticipant_matchId_fkey";
ALTER TABLE "ArticleVue" DROP CONSTRAINT IF EXISTS "ArticleVue_articleId_fkey";
ALTER TABLE "ArticleCommentaire" DROP CONSTRAINT IF EXISTS "ArticleCommentaire_articleId_fkey";
ALTER TABLE "ArticleLike" DROP CONSTRAINT IF EXISTS "ArticleLike_articleId_fkey";
ALTER TABLE "MatchDemo" DROP CONSTRAINT IF EXISTS "MatchDemo_sportId_fkey";
ALTER TABLE "Article" DROP CONSTRAINT IF EXISTS "Article_sportId_fkey";

-- DropTable
DROP TABLE IF EXISTS "MatchParticipant";
DROP TABLE IF EXISTS "ArticleVue";
DROP TABLE IF EXISTS "ArticleCommentaire";
DROP TABLE IF EXISTS "ArticleLike";
DROP TABLE IF EXISTS "MatchDemo";
DROP TABLE IF EXISTS "Article";

-- DropEnum
DROP TYPE IF EXISTS "TypeMatch";
DROP TYPE IF EXISTS "StatutMatch";

-- CreateEnum
CREATE TYPE "SourceActualite" AS ENUM ('NEWSDATA', 'RSS');

-- CreateEnum
CREATE TYPE "CategorieActualite" AS ENUM ('RESULTAT_TOURNOI', 'BOURSE_OPPORTUNITE', 'SELECTION_NATIONALE', 'GENERAL');

-- CreateTable
CREATE TABLE "Actualite" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "resume" TEXT NOT NULL,
    "urlSource" TEXT NOT NULL,
    "imageUrl" TEXT,
    "sourceNom" TEXT NOT NULL,
    "sourceType" "SourceActualite" NOT NULL,
    "categorie" "CategorieActualite" NOT NULL,
    "publieLe" TIMESTAMP(3) NOT NULL,
    "recupereLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Actualite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Actualite_urlSource_key" ON "Actualite"("urlSource");

-- CreateIndex
CREATE INDEX "Actualite_publieLe_idx" ON "Actualite"("publieLe");

-- CreateIndex
CREATE INDEX "Actualite_categorie_idx" ON "Actualite"("categorie");
