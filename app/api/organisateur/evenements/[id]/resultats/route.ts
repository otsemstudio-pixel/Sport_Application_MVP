import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Seule route capable d'écrire dans la table Resultat. Aucun rôle athlète n'y a accès.
export async function POST(
  req: Request,
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

  const { resultats } = await req.json();
  if (!Array.isArray(resultats) || resultats.length === 0) {
    return NextResponse.json(
      { error: "Liste de résultats requise." },
      { status: 400 }
    );
  }

  const athleteIds = resultats.map((r) => r.athleteId);
  const inscriptions = await prisma.inscription.findMany({
    where: { evenementId, athleteId: { in: athleteIds } },
    select: { athleteId: true },
  });
  const athletesInscrits = new Set(inscriptions.map((i) => i.athleteId));

  for (const r of resultats) {
    if (
      !r.athleteId ||
      typeof r.classement !== "number" ||
      typeof r.score !== "number"
    ) {
      return NextResponse.json(
        { error: "Chaque résultat doit avoir athleteId, classement et score." },
        { status: 400 }
      );
    }
    if (!athletesInscrits.has(r.athleteId)) {
      return NextResponse.json(
        {
          error: `L'athlète ${r.athleteId} n'est pas inscrit à cet événement.`,
        },
        { status: 400 }
      );
    }
  }

  const misAJour = await prisma.$transaction(
    resultats.map((r) =>
      prisma.resultat.upsert({
        where: {
          evenementId_athleteId: { evenementId, athleteId: r.athleteId },
        },
        update: { classement: r.classement, score: r.score },
        create: {
          evenementId,
          athleteId: r.athleteId,
          classement: r.classement,
          score: r.score,
        },
      })
    )
  );

  return NextResponse.json(misAJour, { status: 201 });
}
