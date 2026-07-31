import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id: evenementId } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });
  if (!evenement || evenement.organisateurId !== session.organisateurId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const inscriptions = await prisma.inscription.findMany({
    where: { evenementId },
    include: { athlete: { select: { nom: true, ville: true, sportPrincipal: { select: { nom: true } } } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(
    inscriptions.map((i) => ({
      id: i.id,
      athleteId: i.athleteId,
      nom: i.athlete.nom,
      ville: i.athlete.ville,
      sport: i.athlete.sportPrincipal.nom,
      statut: i.statut,
    }))
  );
}
