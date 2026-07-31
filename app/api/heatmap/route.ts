import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const maintenant = new Date();
  const anneeParam = req.nextUrl.searchParams.get("annee");
  const moisParam = req.nextUrl.searchParams.get("mois");
  const annee = anneeParam ? parseInt(anneeParam, 10) : maintenant.getFullYear();
  const mois = moisParam ? parseInt(moisParam, 10) : maintenant.getMonth() + 1;

  const debut = new Date(annee, mois - 1, 1);
  const fin = new Date(annee, mois, 1);

  const seances = await prisma.seanceEntrainement.findMany({
    where: { athleteId: session.athleteId, date: { gte: debut, lt: fin } },
    select: { date: true },
  });

  const parJour = new Map<number, number>();
  for (const s of seances) {
    const jour = s.date.getDate();
    parJour.set(jour, (parJour.get(jour) ?? 0) + 1);
  }

  const jours = [...parJour.entries()]
    .map(([jour, nombreSeances]) => ({ jour, nombreSeances }))
    .sort((a, b) => a.jour - b.jour);

  return NextResponse.json({ annee, mois, jours });
}
