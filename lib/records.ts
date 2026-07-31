import { prisma } from "@/lib/prisma";

// Calcule le record personnel d'un athlète pour un exercice à partir de
// toutes ses séries historiques, puis marque les objectifs ouverts atteints
// si le nouveau record les satisfait.
//
// Règle : si la majorité des séries historiques ont un poids renseigné (ex.
// tractions lestées suivies systématiquement), le record suit le poids max.
// Sinon, il suit le champ correspondant à l'unité de mesure de l'exercice
// (répétitions, durée ou distance), en maximisant ou minimisant selon
// `sensAmelioration` (ex. un temps de sprint doit baisser pour être un
// progrès). Le seuil de majorité évite qu'un poids ajouté ponctuellement sur
// une seule série (ex. un exercice au poids du corps fait une fois avec une
// charge) ne fasse basculer tout le suivi du record vers le poids.
export async function recalculerRecordPersonnel(athleteId: string, exerciceId: string) {
  const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } });
  if (!exercice) return null;

  const series = await prisma.serie.findMany({
    where: { exerciceRealise: { exerciceId, seance: { athleteId } } },
    select: {
      poidsKg: true,
      repetitions: true,
      dureeSecondes: true,
      distanceMetres: true,
      exerciceRealise: { select: { seance: { select: { date: true } } } },
    },
  });
  if (series.length === 0) return null;

  const avecPoids = series.filter((s) => s.poidsKg != null);
  let meilleure: { valeur: number; date: Date } | null = null;

  if (avecPoids.length > series.length / 2) {
    for (const s of avecPoids) {
      const valeur = s.poidsKg!;
      if (!meilleure || valeur > meilleure.valeur) {
        meilleure = { valeur, date: s.exerciceRealise.seance.date };
      }
    }
  } else {
    const champ: "repetitions" | "dureeSecondes" | "distanceMetres" =
      exercice.uniteMesure === "DUREE_SECONDES"
        ? "dureeSecondes"
        : exercice.uniteMesure === "DISTANCE_METRES"
          ? "distanceMetres"
          : "repetitions";
    const plusBasMieux = exercice.sensAmelioration === "PLUS_BAS_MIEUX";

    for (const s of series) {
      const valeur = s[champ];
      if (valeur == null) continue;
      if (!meilleure || (plusBasMieux ? valeur < meilleure.valeur : valeur > meilleure.valeur)) {
        meilleure = { valeur, date: s.exerciceRealise.seance.date };
      }
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

  const estNouveauRecord =
    !ancien ||
    (exercice.sensAmelioration === "PLUS_BAS_MIEUX"
      ? meilleure.valeur < ancien.valeur
      : meilleure.valeur > ancien.valeur);

  if (estNouveauRecord) {
    await marquerObjectifsAtteints(athleteId, exerciceId, meilleure.valeur, exercice.sensAmelioration);
  }

  return { record, estNouveauRecord };
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
