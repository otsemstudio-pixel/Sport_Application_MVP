import { prisma } from "@/lib/prisma";

// Grille de points validée avec l'utilisateur avant implémentation (voir
// Prompt_Claude_Code_Engagement_Duolingo.md, point 2). La séance reste
// l'action de base, les jalons ponctuels valent plus, le repos planifié est
// délibérément récompensé pour ne jamais être vécu comme une perte.
const MONTANTS: Record<
  | "SEANCE_COMPLETEE"
  | "DEFI_DUJOUR"
  | "REPOS_PLANIFIE_RESPECTE"
  | "OBJECTIF_ATTEINT"
  | "RECORD_PERSONNEL"
  | "BADGE_DEBLOQUE"
  | "INSCRIPTION_TOURNOI"
  | "RESULTAT_TOURNOI",
  number
> = {
  SEANCE_COMPLETEE: 10,
  DEFI_DUJOUR: 5,
  REPOS_PLANIFIE_RESPECTE: 5,
  OBJECTIF_ATTEINT: 30,
  RECORD_PERSONNEL: 15,
  BADGE_DEBLOQUE: 10,
  INSCRIPTION_TOURNOI: 15,
  RESULTAT_TOURNOI: 10,
};

export type TypeEvenementXp = keyof typeof MONTANTS;

// Incrémente le total dénormalisé de l'athlète et journalise le gain (le
// journal permet de sommer l'XP sur une fenêtre glissante — semaine de
// ligue en cours, résumé hebdomadaire — ce que le total seul ne permet pas).
// Met aussi à jour xpSemaine du LigueMembre en cours de l'athlète, s'il en a
// un, pour un affichage temps réel sans agrégation à chaque chargement.
export async function attribuerXp(athleteId: string, type: TypeEvenementXp): Promise<void> {
  const montant = MONTANTS[type];

  await prisma.$transaction([
    prisma.athlete.update({ where: { id: athleteId }, data: { xpTotal: { increment: montant } } }),
    prisma.evenementXp.create({ data: { athleteId, type, montant } }),
  ]);

  await prisma.ligueMembre.updateMany({
    where: { athleteId, rangFinal: null },
    data: { xpSemaine: { increment: montant } },
  });
}
