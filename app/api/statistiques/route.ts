import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function debutDeJournee(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function totauxParExercice(athleteId: string, debut: Date, fin: Date) {
  const groupes = await prisma.exerciceRealise.groupBy({
    by: ["exerciceId"],
    where: { seance: { athleteId, date: { gte: debut, lt: fin } } },
    _sum: { valeur: true },
  });
  const exercices = await prisma.exercice.findMany({
    where: { id: { in: groupes.map((g) => g.exerciceId) } },
  });
  const parId = new Map(exercices.map((e) => [e.id, e]));

  return groupes
    .map((g) => {
      const exercice = parId.get(g.exerciceId);
      return {
        exerciceId: g.exerciceId,
        nom: exercice?.nom ?? "",
        uniteMesure: exercice?.uniteMesure ?? "REPETITIONS",
        total: g._sum.valeur ?? 0,
      };
    })
    .sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const periode = req.nextUrl.searchParams.get("periode") ?? "jour";
  const dateParam = req.nextUrl.searchParams.get("date");
  const dateReference = debutDeJournee(dateParam ? new Date(dateParam) : new Date());
  const athleteId = session.athleteId;

  if (periode === "jour") {
    const fin = new Date(dateReference);
    fin.setDate(fin.getDate() + 1);

    const seances = await prisma.seanceEntrainement.findMany({
      where: { athleteId, date: { gte: dateReference, lt: fin } },
      include: { exercicesRealises: { include: { exercice: true } } },
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ periode, date: dateReference, seances });
  }

  if (periode === "semaine") {
    const fin = new Date(dateReference);
    fin.setDate(fin.getDate() + 1);
    const debut = new Date(fin);
    debut.setDate(debut.getDate() - 7);

    const [nombreSeances, totaux] = await Promise.all([
      prisma.seanceEntrainement.count({ where: { athleteId, date: { gte: debut, lt: fin } } }),
      totauxParExercice(athleteId, debut, fin),
    ]);

    return NextResponse.json({ periode, dateDebut: debut, dateFin: fin, nombreSeances, totauxParExercice: totaux });
  }

  if (periode === "mois") {
    const fin = new Date(dateReference);
    fin.setDate(fin.getDate() + 1);
    const debut = new Date(fin);
    debut.setDate(debut.getDate() - 30);
    const debutPrecedent = new Date(debut);
    debutPrecedent.setDate(debutPrecedent.getDate() - 30);

    const [nombreSeances, totaux, nombreSeancesPrecedent] = await Promise.all([
      prisma.seanceEntrainement.count({ where: { athleteId, date: { gte: debut, lt: fin } } }),
      totauxParExercice(athleteId, debut, fin),
      prisma.seanceEntrainement.count({ where: { athleteId, date: { gte: debutPrecedent, lt: debut } } }),
    ]);

    const tendancePourcentage =
      nombreSeancesPrecedent > 0
        ? Math.round(((nombreSeances - nombreSeancesPrecedent) / nombreSeancesPrecedent) * 100)
        : null;

    return NextResponse.json({
      periode,
      dateDebut: debut,
      dateFin: fin,
      nombreSeances,
      totauxParExercice: totaux,
      tendancePourcentage,
    });
  }

  return NextResponse.json({ error: "Période invalide." }, { status: 400 });
}
