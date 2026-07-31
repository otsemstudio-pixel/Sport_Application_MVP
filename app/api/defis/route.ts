import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Défis pertinents pour l'athlète connecté : liés directement à son sport,
// ou à la catégorie de performance de son sport (défis réutilisables).
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

  const defis = await prisma.defi.findMany({
    where: {
      OR: [
        { sportId: athlete.sportPrincipalId },
        { categoriePerformance: athlete.sportPrincipal.categoriePerformance },
      ],
    },
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(defis);
}
