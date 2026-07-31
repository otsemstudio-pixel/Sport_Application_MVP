import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      sport: { select: { nom: true } },
      organisateur: { select: { nom: true, verifie: true } },
      images: { select: { url: true }, orderBy: { ordre: "asc" } },
      _count: { select: { inscriptions: true } },
    },
  });
  if (!evenement) {
    return NextResponse.json({ error: "Événement introuvable." }, { status: 404 });
  }

  let statutInscription: string | null = null;
  if (session.role === "ATHLETE") {
    const inscription = await prisma.inscription.findUnique({
      where: { evenementId_athleteId: { evenementId: id, athleteId: session.athleteId } },
    });
    statutInscription = inscription?.statut ?? null;
  }

  return NextResponse.json({
    id: evenement.id,
    nom: evenement.nom,
    sport: evenement.sport.nom,
    sportId: evenement.sportId,
    lieu: evenement.lieu,
    date: evenement.date,
    placesMax: evenement.placesMax,
    placesRestantes: evenement.placesMax - evenement._count.inscriptions,
    organisateur: evenement.organisateur.nom,
    organisateurVerifie: evenement.organisateur.verifie,
    description: evenement.description,
    niveauRequis: evenement.niveauRequis,
    clubRequis: evenement.clubRequis,
    ageMin: evenement.ageMin,
    ageMax: evenement.ageMax,
    nombreEquipesMax: evenement.nombreEquipesMax,
    equipementFourni: evenement.equipementFourni,
    fraisInscription: evenement.fraisInscription,
    images: evenement.images.map((i) => i.url),
    statutInscription,
  });
}
