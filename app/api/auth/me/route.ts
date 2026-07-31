import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isMineur } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true, sportPrincipal: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }

    const mineur = isMineur(athlete.dateNaissance);
    const consentementValide = !mineur || athlete.consentement?.codeValide === true;

    return NextResponse.json({
      role: "ATHLETE",
      id: athlete.id,
      email: athlete.email,
      nom: athlete.nom,
      dateNaissance: athlete.dateNaissance,
      ville: athlete.ville,
      sport: athlete.sportPrincipal.nom,
      sportId: athlete.sportPrincipalId,
      mineur,
      consentementValide,
      consentement: athlete.consentement
        ? {
            telephoneParent: athlete.consentement.telephoneParent,
            codeValide: athlete.consentement.codeValide,
          }
        : null,
    });
  }

  const organisateur = await prisma.organisateur.findUnique({
    where: { id: session.organisateurId },
  });
  if (!organisateur) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    role: "ORGANISATEUR",
    id: organisateur.id,
    email: organisateur.email,
    nom: organisateur.nom,
    verifie: organisateur.verifie,
  });
}
