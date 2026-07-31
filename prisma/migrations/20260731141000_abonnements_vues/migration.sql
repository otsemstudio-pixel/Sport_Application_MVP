-- Abonnements et vues sur les posts : purement additif (deux nouvelles
-- tables), aucune transformation de données requise.

-- CreateTable
CREATE TABLE "PostVue" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "spectateurId" TEXT NOT NULL,
    "spectateurType" "RoleSession" NOT NULL,
    "vuLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PostVue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Abonnement" (
    "id" TEXT NOT NULL,
    "suiveurId" TEXT NOT NULL,
    "suiveurType" "RoleSession" NOT NULL,
    "suiviId" TEXT NOT NULL,
    "suiviType" "RoleSession" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Abonnement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PostVue_postId_spectateurId_spectateurType_key" ON "PostVue"("postId", "spectateurId", "spectateurType");

-- CreateIndex
CREATE UNIQUE INDEX "Abonnement_suiveurId_suiveurType_suiviId_suiviType_key" ON "Abonnement"("suiveurId", "suiveurType", "suiviId", "suiviType");

-- AddForeignKey
ALTER TABLE "PostVue" ADD CONSTRAINT "PostVue_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
