-- Index de performance : purement additif, aucune transformation de
-- données. Cible les colonnes filtrées/triées fréquemment sans index dédié
-- (identifié lors de l'audit de performance).

-- CreateIndex
CREATE INDEX "SeanceEntrainement_athleteId_date_idx" ON "SeanceEntrainement"("athleteId", "date");

-- CreateIndex
CREATE INDEX "Evenement_date_idx" ON "Evenement"("date");

-- CreateIndex
CREATE INDEX "Post_createdAt_idx" ON "Post"("createdAt");

-- CreateIndex
CREATE INDEX "Post_auteurId_auteurType_idx" ON "Post"("auteurId", "auteurType");

-- CreateIndex
CREATE INDEX "Abonnement_suiviId_suiviType_idx" ON "Abonnement"("suiviId", "suiviType");
