-- Mots-clés NewsData.io dérivés dynamiquement de la table Sport (rotation,
-- au lieu d'une liste en dur) + rattachement optionnel d'une Actualite à un
-- sport, pour permettre le filtrage par sport sur l'écran. Purement additif.

-- AlterTable
ALTER TABLE "Sport" ADD COLUMN "derniereRechercheActualite" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Actualite" ADD COLUMN "sportId" TEXT;

-- CreateIndex
CREATE INDEX "Actualite_sportId_idx" ON "Actualite"("sportId");

-- AddForeignKey
ALTER TABLE "Actualite" ADD CONSTRAINT "Actualite_sportId_fkey" FOREIGN KEY ("sportId") REFERENCES "Sport"("id") ON DELETE SET NULL ON UPDATE CASCADE;
