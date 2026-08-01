// Mascotte scriptée : aucune conversation en langage libre, aucun appel à
// un modèle de langage. Chaque événement pointe vers une clé i18n
// prédéfinie (namespace "mascotte"), jamais du texte généré à la volée.

export type EvenementMascotte =
  | "BIENVENUE"
  | "TACHE_DUJOUR"
  | "TACHE_COMPLETEE"
  | "INACTIVITE_3J"
  | "SEANCE_TERMINEE"
  | "OBJECTIF_ATTEINT"
  | "NOUVEAU_RECORD"
  | "PREMIER_DEFI"
  | "ASTUCE";

export const CLES_MESSAGE_MASCOTTE: Record<EvenementMascotte, string> = {
  BIENVENUE: "bienvenue",
  TACHE_DUJOUR: "tacheDuJour",
  TACHE_COMPLETEE: "tacheCompletee",
  INACTIVITE_3J: "inactivite3j",
  SEANCE_TERMINEE: "seanceTerminee",
  OBJECTIF_ATTEINT: "objectifAtteint",
  NOUVEAU_RECORD: "nouveauRecord",
  PREMIER_DEFI: "premierDefi",
  ASTUCE: "astuce",
};
