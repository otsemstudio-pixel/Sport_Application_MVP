import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Strictement privé : athleteId dérivé exclusivement de la session, jamais
// d'un paramètre. Aucune exception, y compris pour un organisateur vérifié
// (même rigueur que le consentement parental).
export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const mensurations = await prisma.mensuration.findMany({
    where: { athleteId: session.athleteId },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(mensurations);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const athlete = await prisma.athlete.findUnique({ where: { id: session.athleteId } });
  if (!athlete) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  if (!athlete.suiviMensurationsActive) {
    return NextResponse.json({ error: "Le suivi de mensurations n'est pas activé." }, { status: 403 });
  }

  const { date, poidsKg, tailleCm } = (await req.json()) as {
    date?: string;
    poidsKg?: number;
    tailleCm?: number;
  };

  if (typeof poidsKg !== "number" && typeof tailleCm !== "number") {
    return NextResponse.json({ error: "Renseigne au moins le poids ou la taille." }, { status: 400 });
  }

  const mensuration = await prisma.mensuration.create({
    data: {
      athleteId: session.athleteId,
      date: date ? new Date(date) : new Date(),
      poidsKg: typeof poidsKg === "number" ? poidsKg : null,
      tailleCm: typeof tailleCm === "number" ? tailleCm : null,
    },
  });

  return NextResponse.json(mensuration, { status: 201 });
}
