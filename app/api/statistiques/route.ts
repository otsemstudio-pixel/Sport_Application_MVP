import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function debutDeJournee(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function champPrincipal(uniteMesure: string): "repetitions" | "dureeSecondes" | "distanceMetres" {
  if (uniteMesure === "DUREE_SECONDES") return "dureeSecondes";
  if (uniteMesure === "DISTANCE_METRES") return "distanceMetres";
  return "repetitions";
}

async function totauxParExercice(athleteId: string, debut: Date, fin: Date) {
  const lignes = await prisma.exerciceRealise.findMany({
    where: { seance: { athleteId, date: { gte: debut, lt: fin } } },
    select: {
      exerciceId: true,
      exercice: { select: { nom: true, uniteMesure: true } },
      series: { select: { repetitions: true, dureeSecondes: true, distanceMetres: true } },
    },
  });

  const totaux = new Map<string, { nom: string; uniteMesure: string; total: number }>();
  for (const l of lignes) {
    const champ = champPrincipal(l.exercice.uniteMesure);
    const sousTotal = l.series.reduce((acc, s) => acc + (s[champ] ?? 0), 0);
    const existant = totaux.get(l.exerciceId);
    if (existant) existant.total += sousTotal;
    else totaux.set(l.exerciceId, { nom: l.exercice.nom, uniteMesure: l.exercice.uniteMesure, total: sousTotal });
  }

  return [...totaux.entries()]
    .map(([exerciceId, v]) => ({ exerciceId, ...v, total: Math.round(v.total * 100) / 100 }))
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
      include: {
        exercicesRealises: {
          include: { exercice: true, series: { orderBy: { numeroSerie: "asc" } } },
        },
      },
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
