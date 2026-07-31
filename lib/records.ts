import { prisma } from "@/lib/prisma";

type SerieAvecDate = {
  poidsKg: number | null;
  repetitions: number | null;
  dureeSecondes: number | null;
  distanceMetres: number | null;
  exerciceRealise: { seanceId: string; seance: { date: Date } };
};

type Exercice = { uniteMesure: string; sensAmelioration: "PLUS_HAUT_MIEUX" | "PLUS_BAS_MIEUX" };

// Détermine quel champ représente la performance pour cet exercice.
//
// Règle : si la majorité des séries historiques ont un poids renseigné (ex.
// tractions lestées suivies systématiquement), la performance suit le poids
// max. Sinon, elle suit le champ correspondant à l'unité de mesure de
// l'exercice (répétitions, durée ou distance). Le seuil de majorité évite
// qu'un poids ajouté ponctuellement sur une seule série (ex. un exercice au
// poids du corps fait une fois avec une charge) ne fasse basculer tout le
// suivi vers le poids.
function determinerChamp(series: SerieAvecDate[], exercice: Exercice): "poidsKg" | "repetitions" | "dureeSecondes" | "distanceMetres" {
  const avecPoids = series.filter((s) => s.poidsKg != null);
  if (avecPoids.length > series.length / 2) return "poidsKg";
  if (exercice.uniteMesure === "DUREE_SECONDES") return "dureeSecondes";
  if (exercice.uniteMesure === "DISTANCE_METRES") return "distanceMetres";
  return "repetitions";
}

function estMeilleure(valeur: number, actuelle: number, sensAmelioration: Exercice["sensAmelioration"], champ: string) {
  // Le poids suit toujours "plus haut = mieux", même pour un exercice
  // chronométré (soulever plus lourd reste un progrès quel que soit le sens
  // de l'unité de mesure principale de l'exercice).
  if (champ === "poidsKg") return valeur > actuelle;
  return sensAmelioration === "PLUS_BAS_MIEUX" ? valeur < actuelle : valeur > actuelle;
}

async function chargerSeries(athleteId: string, exerciceId: string) {
  return prisma.serie.findMany({
    where: { exerciceRealise: { exerciceId, seance: { athleteId } } },
    select: {
      poidsKg: true,
      repetitions: true,
      dureeSecondes: true,
      distanceMetres: true,
      exerciceRealise: { select: { seanceId: true, seance: { select: { date: true } } } },
    },
    orderBy: { exerciceRealise: { seance: { date: "asc" } } },
  });
}

// Calcule le record personnel d'un athlète pour un exercice à partir de
// toutes ses séries historiques, puis marque les objectifs ouverts atteints
// si le nouveau record les satisfait.
export async function recalculerRecordPersonnel(athleteId: string, exerciceId: string) {
  const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } });
  if (!exercice) return null;

  const series = await chargerSeries(athleteId, exerciceId);
  if (series.length === 0) return null;

  const champ = determinerChamp(series, exercice);
  let meilleure: { valeur: number; date: Date } | null = null;
  for (const s of series) {
    const valeur = s[champ];
    if (valeur == null) continue;
    if (!meilleure || estMeilleure(valeur, meilleure.valeur, exercice.sensAmelioration, champ)) {
      meilleure = { valeur, date: s.exerciceRealise.seance.date };
    }
  }
  if (!meilleure) return null;

  const ancien = await prisma.recordPersonnel.findUnique({
    where: { athleteId_exerciceId: { athleteId, exerciceId } },
  });

  const record = await prisma.recordPersonnel.upsert({
    where: { athleteId_exerciceId: { athleteId, exerciceId } },
    update: { valeur: meilleure.valeur, dateRealisation: meilleure.date },
    create: { athleteId, exerciceId, valeur: meilleure.valeur, dateRealisation: meilleure.date },
  });

  const estNouveauRecord = !ancien || estMeilleure(meilleure.valeur, ancien.valeur, exercice.sensAmelioration, champ);

  if (estNouveauRecord) {
    await marquerObjectifsAtteints(athleteId, exerciceId, meilleure.valeur, exercice.sensAmelioration);
  }

  return { record, estNouveauRecord };
}

// Reconstitue l'évolution du record dans le temps : un point à chaque fois
// que le meilleur-jusqu'ici a changé, calculé à la volée à partir des
// séries existantes (pas de table d'historique séparée à maintenir).
//
// Agrège d'abord par séance (meilleure série de la séance) avant de parcourir
// chronologiquement : plusieurs séries d'une même séance ne peuvent pas
// représenter une régression puis une progression du record en un seul
// entraînement — seule la meilleure série de chaque séance compte pour la
// courbe.
export async function historiqueRecordPersonnel(athleteId: string, exerciceId: string) {
  const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } });
  if (!exercice) return [];

  const series = await chargerSeries(athleteId, exerciceId);
  if (series.length === 0) return [];

  const champ = determinerChamp(series, exercice);

  const meilleureParSeance = new Map<string, { date: Date; valeur: number }>();
  for (const s of series) {
    const valeur = s[champ];
    if (valeur == null) continue;
    const seanceId = s.exerciceRealise.seanceId;
    const existante = meilleureParSeance.get(seanceId);
    if (!existante || estMeilleure(valeur, existante.valeur, exercice.sensAmelioration, champ)) {
      meilleureParSeance.set(seanceId, { date: s.exerciceRealise.seance.date, valeur });
    }
  }

  const parSeanceTriee = [...meilleureParSeance.values()].sort((a, b) => a.date.getTime() - b.date.getTime());

  const points: { date: Date; valeur: number }[] = [];
  let meilleure: number | null = null;
  for (const s of parSeanceTriee) {
    if (meilleure === null || estMeilleure(s.valeur, meilleure, exercice.sensAmelioration, champ)) {
      meilleure = s.valeur;
      points.push(s);
    }
  }

  return points;
}

export async function marquerObjectifsAtteints(
  athleteId: string,
  exerciceId: string,
  valeurRecord: number,
  sensAmelioration: "PLUS_HAUT_MIEUX" | "PLUS_BAS_MIEUX"
) {
  const objectifsOuverts = await prisma.objectif.findMany({
    where: { athleteId, exerciceId, atteint: false },
  });
  const satisfait = (cible: number) =>
    sensAmelioration === "PLUS_BAS_MIEUX" ? valeurRecord <= cible : valeurRecord >= cible;

  for (const o of objectifsOuverts) {
    if (satisfait(o.valeurCible)) {
      await prisma.objectif.update({
        where: { id: o.id },
        data: { atteint: true, dateAtteint: new Date() },
      });
    }
  }
}
