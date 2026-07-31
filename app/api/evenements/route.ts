import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const ville = req.nextUrl.searchParams.get("ville") ?? undefined;
  const sport = req.nextUrl.searchParams.get("sport") ?? undefined;

  const evenements = await prisma.evenement.findMany({
    where: {
      lieu: ville ? { contains: ville } : undefined,
      sport: sport ? { equals: sport } : undefined,
    },
    include: {
      organisateur: { select: { nom: true, verifie: true } },
      _count: { select: { inscriptions: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(
    evenements.map((e) => ({
      id: e.id,
      nom: e.nom,
      sport: e.sport,
      lieu: e.lieu,
      date: e.date,
      placesMax: e.placesMax,
      placesRestantes: e.placesMax - e._count.inscriptions,
      organisateur: e.organisateur.nom,
      organisateurVerifie: e.organisateur.verifie,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { nom, sport, lieu, date, placesMax } = await req.json();
  if (!nom || !sport || !lieu || !date || !placesMax) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }
  if (typeof placesMax !== "number" || placesMax <= 0) {
    return NextResponse.json(
      { error: "placesMax doit être un nombre positif." },
      { status: 400 }
    );
  }

  const evenement = await prisma.evenement.create({
    data: {
      organisateurId: session.organisateurId,
      nom,
      sport,
      lieu,
      date: new Date(date),
      placesMax,
    },
  });

  return NextResponse.json(evenement, { status: 201 });
}
