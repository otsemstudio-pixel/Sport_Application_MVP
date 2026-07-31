import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluerBadges } from "@/lib/badges";

// Les séances sont strictement privées : seul l'athlète propriétaire peut les lire ou en créer.
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const seances = await prisma.seance.findMany({
    where: { athleteId: session.athleteId },
    include: { defi: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { defiId, valeurMesuree } = await req.json();
  if (!defiId || typeof valeurMesuree !== "number") {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const defi = await prisma.defi.findUnique({ where: { id: defiId } });
  if (!defi) {
    return NextResponse.json({ error: "Défi introuvable." }, { status: 404 });
  }

  const seance = await prisma.seance.create({
    data: {
      athleteId: session.athleteId,
      defiId,
      valeurMesuree,
    },
  });

  const nouveauxBadges = await evaluerBadges(session.athleteId);

  return NextResponse.json({ seance, nouveauxBadges }, { status: 201 });
}
