import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { historiqueRecordPersonnel } from "@/lib/records";

function debutFenetre(periode: string): Date | null {
  if (periode === "tout") return null;
  const jours = periode === "1m" ? 30 : periode === "6m" ? 180 : 90;
  const d = new Date();
  d.setDate(d.getDate() - jours);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Lundi de la semaine calendaire contenant cette date.
function debutSemaine(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const jour = d.getDay();
  const diff = (jour === 0 ? -6 : 1) - jour;
  d.setDate(d.getDate() + diff);
  return d;
}

function champPrincipal(uniteMesure: string): "repetitions" | "dureeSecondes" | "distanceMetres" {
  if (uniteMesure === "DUREE_SECONDES") return "dureeSecondes";
  if (uniteMesure === "DISTANCE_METRES") return "distanceMetres";
  return "repetitions";
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id: exerciceId } = await params;

  const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } });
  if (!exercice) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  const periode = req.nextUrl.searchParams.get("periode") ?? "3m";
  const depuis = debutFenetre(periode);

  const historique = await historiqueRecordPersonnel(session.athleteId, exerciceId);
  let recordDansLeTemps = historique;
  if (depuis) {
    const avantFenetre = historique.filter((p) => p.date < depuis);
    const dansFenetre = historique.filter((p) => p.date >= depuis);
    recordDansLeTemps =
      avantFenetre.length > 0
        ? [{ date: depuis, valeur: avantFenetre[avantFenetre.length - 1].valeur }, ...dansFenetre]
        : dansFenetre;
  }

  const champ = champPrincipal(exercice.uniteMesure);
  const lignes = await prisma.exerciceRealise.findMany({
    where: {
      exerciceId,
      seance: { athleteId: session.athleteId, date: depuis ? { gte: depuis } : undefined },
    },
    select: { series: { select: { [champ]: true } }, seance: { select: { date: true } } },
  });

  const totauxParSemaine = new Map<string, number>();
  for (const l of lignes) {
    const cle = debutSemaine(l.seance.date).toISOString();
    const sousTotal = l.series.reduce((acc, s) => acc + ((s as Record<string, number | null>)[champ] ?? 0), 0);
    totauxParSemaine.set(cle, (totauxParSemaine.get(cle) ?? 0) + sousTotal);
  }
  const volumeParSemaine = [...totauxParSemaine.entries()]
    .map(([semaineDebut, total]) => ({ semaineDebut, total: Math.round(total * 100) / 100 }))
    .sort((a, b) => a.semaineDebut.localeCompare(b.semaineDebut));

  return NextResponse.json({
    periode,
    exerciceNom: exercice.nom,
    uniteMesure: exercice.uniteMesure,
    recordDansLeTemps,
    volumeParSemaine,
  });
}
