-- Menu Actualités : contenu éditorial (Article) et scores de matchs de
-- démonstration (MatchDemo), tous deux rattachés à un Sport. Purement
-- additif, aucune modification de table existante.

-- CreateEnum
CREATE TYPE "StatutMatch" AS ENUM ('A_VENIR', 'EN_COURS', 'TERMINE');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "titre" TEXT NOT NULL,
    "chapo" TEXT NOT NULL,
    "contenu" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "publieLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleLike" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleLike_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleCommentaire" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "contenu" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleCommentaire_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleVue" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "spectateurId" TEXT NOT NULL,
    "spectateurType" "RoleSession" NOT NULL,
    "vuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleVue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MatchDemo" (
    "id" TEXT NOT NULL,
    "sportId" TEXT NOT NULL,
    "equipeA" TEXT NOT NULL,
    "equipeB" TEXT NOT NULL,
    "scoreA" INTEGER NOT NULL,
    "scoreB" INTEGER NOT NULL,
    "statut" "StatutMatch" NOT NULL,
    "minuteAffichee" TEXT,
    "lieu" TEXT NOT NULL,
    "dateMatch" TIMESTAMP(3) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchDemo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_publieLe_idx" ON "Article"("publieLe");

-- CreateIndex
CREATE INDEX "Article_sportId_idx" ON "Article"("sportId");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleLike_articleId_auteurId_auteurType_key" ON "ArticleLike"("articleId", "auteurId", "auteurType");

-- CreateIndex
CREATE INDEX "ArticleCommentaire_articleId_createdAt_idx" ON "ArticleCommentaire"("articleId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArticleVue_articleId_spectateurId_spectateurType_key" ON "ArticleVue"("articleId", "spectateurId", "spectateurType");

-- CreateIndex
CREATE INDEX "MatchDemo_sportId_idx" ON "MatchDemo"("sportId");

-- CreateIndex
CREATE INDEX "MatchDemo_statut_idx" ON "MatchDemo"("statut");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleLike" ADD CONSTRAINT "ArticleLike_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleCommentaire" ADD CONSTRAINT "ArticleCommentaire_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleVue" ADD CONSTRAINT "ArticleVue_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MatchDemo" ADD CONSTRAINT "MatchDemo_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
