import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

// Publie une séance terminée dans le fil social. Jamais automatique :
// n'existe que si l'athlète clique explicitement sur "Partager".
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id: seanceId } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  if (estBloquePourConsentement(athlete)) {
    return NextResponse.json(
      { error: "Ce profil mineur doit obtenir le consentement parental avant de publier." },
      { status: 403 }
    );
  }

  const seance = await prisma.seanceEntrainement.findUnique({ where: { id: seanceId } });
  if (!seance) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }
  if (seance.athleteId !== session.athleteId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { contenu } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }
  if (contenu.length > 500) {
    return NextResponse.json(
      { error: "Le contenu est limité à 500 caractères." },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      auteurId: session.athleteId,
      auteurType: "ATHLETE",
      contenu: contenu.trim(),
      seanceEntrainementId: seanceId,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
