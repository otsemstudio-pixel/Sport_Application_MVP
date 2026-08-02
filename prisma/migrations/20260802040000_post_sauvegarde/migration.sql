-- CreateTable
CREATE TABLE "PostSauvegarde" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "auteurId" TEXT NOT NULL,
    "auteurType" "RoleSession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostSauvegarde_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostSauvegarde_postId_auteurId_auteurType_key" ON "PostSauvegarde"("postId", "auteurId", "auteurType");

-- AddForeignKey
ALTER TABLE "PostSauvegarde" ADD CONSTRAINT "PostSauvegarde_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
