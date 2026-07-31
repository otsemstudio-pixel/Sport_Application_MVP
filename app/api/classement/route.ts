import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Classement local par nombre de séances enregistrées, filtré par ville + sport.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const ville = req.nextUrl.searchParams.get("ville");
  const sport = req.nextUrl.searchParams.get("sport");
  if (!ville || !sport) {
    return NextResponse.json(
      { error: "Paramètres ville et sport requis." },
      { status: 400 }
    );
  }

  const groupes = await prisma.seance.groupBy({
    by: ["athleteId"],
    where: { athlete: { ville, sport } },
    _count: { _all: true },
    orderBy: { _count: { athleteId: "desc" } },
    take: 50,
  });

  const athletes = await prisma.athlete.findMany({
    where: { id: { in: groupes.map((g) => g.athleteId) } },
    select: { id: true, nom: true },
  });
  const nomParId = new Map(athletes.map((a) => [a.id, a.nom]));

  const classement = groupes.map((g, index) => ({
    rang: index + 1,
    athleteId: g.athleteId,
    nom: nomParId.get(g.athleteId) ?? "Athlète",
    nombreSeances: g._count._all,
  }));

  return NextResponse.json(classement);
}
