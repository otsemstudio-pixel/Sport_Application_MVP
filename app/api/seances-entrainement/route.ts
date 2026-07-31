import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluerBadges } from "@/lib/badges";

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
    include: { exercicesRealises: { include: { exercice: true } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { noteOptionnelle, exercices } = await req.json();
  if (!Array.isArray(exercices) || exercices.length === 0) {
    return NextResponse.json({ error: "Ajoute au moins un exercice." }, { status: 400 });
  }
  for (const e of exercices) {
    if (!e.exerciceId || typeof e.valeur !== "number") {
      return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
    }
  }

  const idsExercices = exercices.map((e: { exerciceId: string }) => e.exerciceId);
  const exercicesValides = await prisma.exercice.findMany({
    where: { id: { in: idsExercices } },
    select: { id: true },
  });
  if (exercicesValides.length !== new Set(idsExercices).size) {
    return NextResponse.json({ error: "Exercice introuvable." }, { status: 404 });
  }

  const seance = await prisma.seanceEntrainement.create({
    data: {
      athleteId: session.athleteId,
      noteOptionnelle: noteOptionnelle || null,
      exercicesRealises: {
        create: exercices.map((e: { exerciceId: string; valeur: number; series?: number }) => ({
          exerciceId: e.exerciceId,
          valeur: e.valeur,
          series: typeof e.series === "number" ? e.series : null,
        })),
      },
    },
    include: { exercicesRealises: { include: { exercice: true } } },
  });

  const nouveauxBadges = await evaluerBadges(session.athleteId);

  return NextResponse.json({ seance, nouveauxBadges }, { status: 201 });
}
