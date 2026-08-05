import { prisma } from "@/lib/prisma";

export const JOKERS_MAX_PAR_MOIS = 2;

function cleJourUTC(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function jourSemaineUTC(date: Date): number {
  return date.getUTCDay();
}

export type Assiduite = {
  serieActuelle: number;
  recordSerie: number;
  joursReposPlanifies: number[];
  jokersUtilisesCeMois: number;
  jokersRestants: number;
};

// La série (streak) n'est jamais stockée : elle est recalculée à chaque
// appel depuis l'historique réel des séances, des jours de repos planifiés
// et des jokers utilisés. Un jour "compte" pour la série s'il contient au
// moins une séance, s'il est couvert par un joker, ou si c'est un jour de
// repos planifié (le repos fait partie du programme, pas une absence).
export async function calculerAssiduite(athleteId: string): Promise<Assiduite> {
  const [seances, preference, jokers] = await Promise.all([
    prisma.seanceEntrainement.findMany({ where: { athleteId }, select: { date: true } }),
    prisma.preferenceAssiduite.findUnique({ where: { athleteId } }),
    prisma.jokerAssiduite.findMany({ where: { athleteId }, select: { dateCouverte: true } }),
  ]);

  const joursSeance = new Set(seances.map((s) => cleJourUTC(s.date)));
  const joursJoker = new Set(jokers.map((j) => cleJourUTC(j.dateCouverte)));
  const joursReposPlanifies = preference?.joursReposPlanifies ?? [];
  const joursReposSet = new Set(joursReposPlanifies);

  function jourQualifie(date: Date): boolean {
    const cle = cleJourUTC(date);
    return joursSeance.has(cle) || joursJoker.has(cle) || joursReposSet.has(jourSemaineUTC(date));
  }

  const aujourdhui = new Date();
  aujourdhui.setUTCHours(0, 0, 0, 0);

  // La série ne casse qu'à la fin d'une journée sans jour qualifiant :
  // aujourd'hui n'a pas besoin d'être déjà rempli pour que la série reste
  // intacte, on démarre alors le comptage à hier.
  const curseur = new Date(aujourdhui);
  if (!jourQualifie(curseur)) {
    curseur.setUTCDate(curseur.getUTCDate() - 1);
  }
  let serieActuelle = 0;
  while (jourQualifie(curseur)) {
    serieActuelle++;
    curseur.setUTCDate(curseur.getUTCDate() - 1);
  }

  // Record all-time : balayage chronologique complet depuis le premier jour
  // qualifiant connu — volume de données par athlète trop faible pour que ce
  // soit un problème de performance.
  const joursConnus = [...joursSeance, ...joursJoker].sort();
  let recordSerie = serieActuelle;
  if (joursConnus.length > 0) {
    const courant = new Date(joursConnus[0]);
    let courante = 0;
    while (courant.getTime() <= aujourdhui.getTime()) {
      if (jourQualifie(courant)) {
        courante++;
        recordSerie = Math.max(recordSerie, courante);
      } else {
        courante = 0;
      }
      courant.setUTCDate(courant.getUTCDate() + 1);
    }
  }

  const debutMois = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth(), 1));
  const jokersUtilisesCeMois = jokers.filter((j) => j.dateCouverte >= debutMois).length;

  return {
    serieActuelle,
    recordSerie,
    joursReposPlanifies,
    jokersUtilisesCeMois,
    jokersRestants: Math.max(0, JOKERS_MAX_PAR_MOIS - jokersUtilisesCeMois),
  };
}
