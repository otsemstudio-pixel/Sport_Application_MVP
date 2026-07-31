import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluerBadges } from "@/lib/badges";
import { recalculerRecordPersonnel } from "@/lib/records";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const dateParam = req.nextUrl.searchParams.get("date");
  let plage: { gte: Date; lt: Date } | undefined;
  if (dateParam) {
    const debut = new Date(dateParam);
    debut.setHours(0, 0, 0, 0);
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 1);
    plage = { gte: debut, lt: fin };
  }

  const seances = await prisma.seanceEntrainement.findMany({
    where: { athleteId: session.athleteId, date: plage },
    include: {
      exercicesRealises: {
        include: { exercice: true, series: { orderBy: { numeroSerie: "asc" } } },
      },
    },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
}

type SerieEntree = {
  repetitions?: number;
  poidsKg?: number;
  dureeSecondes?: number;
  distanceMetres?: number;
  tempsReposSecondes?: number;
};
type ExerciceEntree = { exerciceId: string; series: SerieEntree[] };

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { noteOptionnelle, programmeSeanceId, exercices } = (await req.json()) as {
    noteOptionnelle?: string;
    programmeSeanceId?: string;
    exercices: ExerciceEntree[];
  };

  if (!Array.isArray(exercices) || exercices.length === 0) {
    return NextResponse.json({ error: "Ajoute au moins un exercice." }, { status: 400 });
  }
  for (const e of exercices) {
    if (!e.exerciceId || !Array.isArray(e.series) || e.series.length === 0) {
      return NextResponse.json({ error: "Chaque exercice doit avoir au moins une série." }, { status: 400 });
    }
    for (const s of e.series) {
      if (
        typeof s.repetitions !== "number" &&
        typeof s.poidsKg !== "number" &&
        typeof s.dureeSecondes !== "number" &&
        typeof s.distanceMetres !== "number"
      ) {
        return NextResponse.json({ error: "Chaque série doit avoir au moins une valeur mesurée." }, { status: 400 });
      }
    }
  }

  const idsExercices = exercices.map((e) => e.exerciceId);
  const exercicesValides = await prisma.exercice.findMany({
    where: { id: { in: idsExercices } },
    select: { id: true },
  });
  if (exercicesValides.length !== new Set(idsExercices).size) {
    return NextResponse.json({ error: "Exercice introuvable." }, { status: 404 });
  }

  if (programmeSeanceId) {
    const programmeSeance = await prisma.programmeSeance.findUnique({ where: { id: programmeSeanceId } });
    if (!programmeSeance) {
      return NextResponse.json({ error: "Séance de programme introuvable." }, { status: 404 });
    }
  }

  const seance = await prisma.seanceEntrainement.create({
    data: {
      athleteId: session.athleteId,
      noteOptionnelle: noteOptionnelle || null,
      programmeSeanceId: programmeSeanceId || null,
      exercicesRealises: {
        create: exercices.map((e) => ({
          exerciceId: e.exerciceId,
          series: {
            create: e.series.map((s, index) => ({
              numeroSerie: index + 1,
              repetitions: typeof s.repetitions === "number" ? s.repetitions : null,
              poidsKg: typeof s.poidsKg === "number" ? s.poidsKg : null,
              dureeSecondes: typeof s.dureeSecondes === "number" ? s.dureeSecondes : null,
              distanceMetres: typeof s.distanceMetres === "number" ? s.distanceMetres : null,
              tempsReposSecondes: typeof s.tempsReposSecondes === "number" ? s.tempsReposSecondes : null,
            })),
          },
        })),
      },
    },
    include: {
      exercicesRealises: {
        include: { exercice: true, series: { orderBy: { numeroSerie: "asc" } } },
      },
    },
  });

  const nouveauxBadges = await evaluerBadges(session.athleteId);

  // Exercices indépendants les uns des autres : recalcul en parallèle plutôt
  // qu'une boucle séquentielle d'appels réseau vers la base de données.
  const idsExercicesUniques = [...new Set(idsExercices)];
  const resultats = await Promise.all(
    idsExercicesUniques.map((exerciceId) => recalculerRecordPersonnel(session.athleteId, exerciceId))
  );
  const nouveauxRecords = resultats
    .map((resultat, index) =>
      resultat?.estNouveauRecord ? { exerciceId: idsExercicesUniques[index], valeur: resultat.record.valeur } : null
    )
    .filter((r): r is { exerciceId: string; valeur: number } => r !== null);

  return NextResponse.json({ seance, nouveauxBadges, nouveauxRecords }, { status: 201 });
}
