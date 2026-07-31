import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const evenements = await prisma.evenement.findMany({
    where: { organisateurId: session.organisateurId },
    include: { sport: { select: { nom: true } }, _count: { select: { inscriptions: true } } },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(
    evenements.map((e) => ({
      id: e.id,
      nom: e.nom,
      sport: e.sport.nom,
      lieu: e.lieu,
      date: e.date,
      placesMax: e.placesMax,
      nombreInscrits: e._count.inscriptions,
    }))
  );
}
