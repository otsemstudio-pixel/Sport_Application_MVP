import { prisma } from "@/lib/prisma";

type CategoriePerformance =
  | "EXPLOSIVITE_PUISSANCE"
  | "ENDURANCE"
  | "COLLECTIF_TACTIQUE"
  | "COMBAT"
  | "RENFORCEMENT_GENERAL";

export type SeanceDuJourProgramme = {
  id: string;
  programmeId: string;
  nomSeance: string;
  exercicesPrevus: {
    exerciceId: string;
    seriesPrevues: number | null;
    repetitionsPrevues: number | null;
    dureePrevueSecondes: number | null;
    distancePrevueMetres: number | null;
    poidsPrevuKg: number | null;
    exercice: {
      id: string;
      nom: string;
      beneficePerformance: string | null;
      uniteMesure: "REPETITIONS" | "DUREE_SECONDES" | "DISTANCE_METRES" | "SERIES_X_REPETITIONS";
    };
  }[];
};

export type TacheDuJourInfo = {
  titre: string;
  beneficePerformance: string | null;
  exerciceId: string;
};

function calculerSeanceDuJour(dateDebut: Date, dureeSemaines: number) {
  const joursEcoules = Math.floor((Date.now() - dateDebut.getTime()) / 86_400_000);
  const numeroSemaine = Math.floor(joursEcoules / 7) + 1;
  const numeroJour = (joursEcoules % 7) + 1;
  if (numeroSemaine < 1 || numeroSemaine > dureeSemaines) return null;
  return { numeroSemaine, numeroJour };
}

// Séance de programme prévue aujourd'hui pour l'athlète, si un programme est
// en cours et que le jour calculé tombe dans sa durée.
export async function determinerSeanceDuJourProgramme(athleteId: string): Promise<SeanceDuJourProgramme | null> {
  const programmeSuivi = await prisma.athleteProgramme.findFirst({
    where: { athleteId, statut: "EN_COURS" },
    include: { programme: true },
    orderBy: { dateDebut: "desc" },
  });
  if (!programmeSuivi) return null;

  const jour = calculerSeanceDuJour(programmeSuivi.dateDebut, programmeSuivi.programme.dureeSemaines);
  if (!jour) return null;

  const programmeSeance = await prisma.programmeSeance.findFirst({
    where: { programmeId: programmeSuivi.programmeId, numeroSemaine: jour.numeroSemaine, numeroJour: jour.numeroJour },
    include: { exercicesPrevus: { include: { exercice: true } } },
  });
  if (!programmeSeance) return null;

  return {
    id: programmeSeance.id,
    programmeId: programmeSuivi.programmeId,
    nomSeance: programmeSeance.nomSeance,
    exercicesPrevus: programmeSeance.exercicesPrevus,
  };
}

// Tâche du jour : la séance de programme prévue si elle existe, sinon un
// exercice suggéré (catégorie de l'athlète, le moins réalisé sur les 7
// derniers jours). Réutilisée à la fois par l'écran Entraînement et par la
// route de création de séance (pour détecter le bonus XP "défi du jour").
export async function determinerTacheDuJour(
  athleteId: string,
  categoriePerformance: CategoriePerformance,
  seanceDuJourProgramme?: SeanceDuJourProgramme | null
): Promise<TacheDuJourInfo | null> {
  const programme =
    seanceDuJourProgramme !== undefined ? seanceDuJourProgramme : await determinerSeanceDuJourProgramme(athleteId);

  if (programme) {
    const premierExercicePrevu = programme.exercicesPrevus[0];
    return {
      titre: programme.nomSeance,
      beneficePerformance: premierExercicePrevu?.exercice.beneficePerformance ?? null,
      exerciceId: premierExercicePrevu?.exerciceId ?? "",
    };
  }

  const exercices = await prisma.exercice.findMany({
    where: { OR: [{ categoriePerformance }, { categoriePerformance: "RENFORCEMENT_GENERAL" }] },
    orderBy: { nom: "asc" },
  });
  if (exercices.length === 0) return null;

  const septJoursAvant = new Date(Date.now() - 7 * 86_400_000);
  const realisationsRecentes = await prisma.exerciceRealise.groupBy({
    by: ["exerciceId"],
    where: { seance: { athleteId, date: { gte: septJoursAvant } } },
    _count: { _all: true },
  });
  const compteParExercice = new Map(realisationsRecentes.map((r) => [r.exerciceId, r._count._all]));
  const exerciceSuggere = exercices.reduce((moins, e) =>
    (compteParExercice.get(e.id) ?? 0) < (compteParExercice.get(moins.id) ?? 0) ? e : moins
  );
  return {
    titre: exerciceSuggere.nom,
    beneficePerformance: exerciceSuggere.beneficePerformance,
    exerciceId: exerciceSuggere.id,
  };
}
