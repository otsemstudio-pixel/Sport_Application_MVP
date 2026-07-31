import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const records = await prisma.recordPersonnel.findMany({
    where: { athleteId: session.athleteId },
    include: { exercice: { select: { nom: true, uniteMesure: true } } },
  });

  return NextResponse.json(
    records.map((r) => ({
      exerciceId: r.exerciceId,
      exerciceNom: r.exercice.nom,
      uniteMesure: r.exercice.uniteMesure,
      valeur: r.valeur,
      dateRealisation: r.dateRealisation,
    }))
  );
}
