import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id: evenementId } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  if (estBloquePourConsentement(athlete)) {
    return NextResponse.json(
      {
        error:
          "Ce profil mineur doit obtenir le consentement parental avant de s'inscrire à un événement.",
      },
      { status: 403 }
    );
  }

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    include: { _count: { select: { inscriptions: true } } },
  });
  if (!evenement) {
    return NextResponse.json(
      { error: "Événement introuvable." },
      { status: 404 }
    );
  }

  const dejaInscrit = await prisma.inscription.findUnique({
    where: {
      evenementId_athleteId: { evenementId, athleteId: athlete.id },
    },
  });
  if (dejaInscrit) {
    return NextResponse.json(
      { error: "Déjà inscrit à cet événement." },
      { status: 409 }
    );
  }

  if (evenement._count.inscriptions >= evenement.placesMax) {
    return NextResponse.json(
      { error: "Événement complet." },
      { status: 409 }
    );
  }

  const inscription = await prisma.inscription.create({
    data: { evenementId, athleteId: athlete.id },
  });

  return NextResponse.json(inscription, { status: 201 });
}
