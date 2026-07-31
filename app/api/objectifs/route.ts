import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const objectifs = await prisma.objectif.findMany({
    where: { athleteId: session.athleteId },
    include: { exercice: { select: { nom: true, uniteMesure: true, sensAmelioration: true } } },
    orderBy: { createdAt: "desc" },
  });

  const records = await prisma.recordPersonnel.findMany({
    where: { athleteId: session.athleteId, exerciceId: { in: objectifs.map((o) => o.exerciceId) } },
  });
  const recordParExercice = new Map(records.map((r) => [r.exerciceId, r.valeur]));

  return NextResponse.json(
    objectifs.map((o) => ({
      id: o.id,
      exerciceId: o.exerciceId,
      exerciceNom: o.exercice.nom,
      uniteMesure: o.exercice.uniteMesure,
      sensAmelioration: o.exercice.sensAmelioration,
      valeurCible: o.valeurCible,
      valeurActuelle: recordParExercice.get(o.exerciceId) ?? null,
      dateLimite: o.dateLimite,
      atteint: o.atteint,
      dateAtteint: o.dateAtteint,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { exerciceId, valeurCible, dateLimite } = (await req.json()) as {
    exerciceId?: string;
    valeurCible?: number;
    dateLimite?: string;
  };

  if (!exerciceId || typeof valeurCible !== "number" || valeurCible <= 0) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  const exercice = await prisma.exercice.findUnique({ where: { id: exerciceId } });
  if (!exercice) {
    return NextResponse.json({ error: "Exercice introuvable." }, { status: 404 });
  }

  const recordActuel = await prisma.recordPersonnel.findUnique({
    where: { athleteId_exerciceId: { athleteId: session.athleteId, exerciceId } },
  });
  const dejaAtteint = recordActuel
    ? exercice.sensAmelioration === "PLUS_BAS_MIEUX"
      ? recordActuel.valeur <= valeurCible
      : recordActuel.valeur >= valeurCible
    : false;

  const objectif = await prisma.objectif.create({
    data: {
      athleteId: session.athleteId,
      exerciceId,
      valeurCible,
      dateLimite: dateLimite ? new Date(dateLimite) : null,
      atteint: dejaAtteint,
      dateAtteint: dejaAtteint ? new Date() : null,
    },
  });

  return NextResponse.json(objectif, { status: 201 });
}
