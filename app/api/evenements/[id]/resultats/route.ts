import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Lecture seule : la saisie des résultats se fait exclusivement via
// /api/organisateur/evenements/[id]/resultats, réservée à l'organisateur créateur.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id: evenementId } = await params;

  const resultats = await prisma.resultat.findMany({
    where: { evenementId },
    include: { athlete: { select: { nom: true } } },
    orderBy: { classement: "asc" },
  });

  return NextResponse.json(
    resultats.map((r) => ({
      athleteId: r.athleteId,
      nom: r.athlete.nom,
      classement: r.classement,
      score: r.score,
    }))
  );
}
