import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Exercices pertinents pour l'athlète connecté : ceux de la catégorie de
// performance de son sport, plus les exercices de renforcement général
// (utilisables par tous les sports).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { sportPrincipal: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  const exercices = await prisma.exercice.findMany({
    where: {
      OR: [
        { categoriePerformance: athlete.sportPrincipal.categoriePerformance },
        { categoriePerformance: "RENFORCEMENT_GENERAL" },
      ],
    },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(exercices);
}
