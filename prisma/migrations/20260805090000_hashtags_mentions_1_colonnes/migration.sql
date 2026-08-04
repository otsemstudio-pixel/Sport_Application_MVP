-- Phase 1/2 : ajoute nomUtilisateur en NULLABLE (backfill par script ensuite
-- pour les comptes existants, colonne verrouillée en NOT NULL + UNIQUE dans
-- la migration suivante) + les nouvelles tables Hashtag/PostHashtag/Mention.

-- AlterTable
ALTER TABLE "Athlete" ADD COLUMN "nomUtilisateur" TEXT;

-- AlterTable
ALTER TABLE "Organisateur" ADD COLUMN "nomUtilisateur" TEXT;

-- CreateTable
CREATE TABLE "Hashtag" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PostHashtag" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "hashtagId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostHashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mention" (
    "id" TEXT NOT NULL,
    "postId" TEXT,
    "commentaireId" TEXT,
    "mentionneId" TEXT NOT NULL,
    "mentionneType" "RoleSession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mention_pkey" PRIMARY KEY ("id")
);

-- Une mention appartient à un post OU un commentaire, jamais les deux, jamais
-- aucun des deux.
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_post_xor_commentaire" CHECK (("postId" IS NOT NULL) <> ("commentaireId" IS NOT NULL));

-- CreateIndex
CREATE UNIQUE INDEX "Hashtag_tag_key" ON "Hashtag"("tag");

-- CreateIndex
CREATE INDEX "PostHashtag_hashtagId_idx" ON "PostHashtag"("hashtagId");

-- CreateIndex
CREATE UNIQUE INDEX "PostHashtag_postId_hashtagId_key" ON "PostHashtag"("postId", "hashtagId");

-- CreateIndex
CREATE INDEX "Mention_mentionneId_mentionneType_idx" ON "Mention"("mentionneId", "mentionneType");

-- CreateIndex
CREATE INDEX "Mention_postId_idx" ON "Mention"("postId");

-- CreateIndex
CREATE INDEX "Mention_commentaireId_idx" ON "Mention"("commentaireId");

-- AddForeignKey
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PostHashtag" ADD CONSTRAINT "PostHashtag_hashtagId_fkey" FOREIGN KEY ("hashtagId") REFERENCES "Hashtag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mention" ADD CONSTRAINT "Mention_commentaireId_fkey" FOREIGN KEY ("commentaireId") REFERENCES "PostCommentaire"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
