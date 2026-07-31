import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { NOMBRE_MAX_IMAGES } from "@/lib/upload";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const ville = req.nextUrl.searchParams.get("ville") ?? undefined;
  const sportId = req.nextUrl.searchParams.get("sportId") ?? undefined;

  const evenements = await prisma.evenement.findMany({
    where: {
      lieu: ville ? { contains: ville } : undefined,
      sportId: sportId ? { equals: sportId } : undefined,
    },
    include: {
      sport: { select: { nom: true } },
      organisateur: { select: { nom: true, verifie: true } },
      images: { select: { url: true }, orderBy: { ordre: "asc" } },
      _count: { select: { inscriptions: true } },
    },
    orderBy: { date: "asc" },
  });

  return NextResponse.json(
    evenements.map((e) => ({
      id: e.id,
      nom: e.nom,
      sport: e.sport.nom,
      sportId: e.sportId,
      lieu: e.lieu,
      date: e.date,
      placesMax: e.placesMax,
      placesRestantes: e.placesMax - e._count.inscriptions,
      organisateur: e.organisateur.nom,
      organisateurVerifie: e.organisateur.verifie,
      description: e.description,
      niveauRequis: e.niveauRequis,
      clubRequis: e.clubRequis,
      ageMin: e.ageMin,
      ageMax: e.ageMax,
      nombreEquipesMax: e.nombreEquipesMax,
      equipementFourni: e.equipementFourni,
      fraisInscription: e.fraisInscription,
      imageCouverture: e.images[0]?.url ?? null,
    }))
  );
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const {
    nom,
    sportId,
    lieu,
    date,
    placesMax,
    description,
    niveauRequis,
    clubRequis,
    ageMin,
    ageMax,
    nombreEquipesMax,
    equipementFourni,
    fraisInscription,
    images,
  } = await req.json();

  if (!nom || !sportId || !lieu || !date || !placesMax || !description || !niveauRequis) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }
  if (typeof placesMax !== "number" || placesMax <= 0) {
    return NextResponse.json(
      { error: "placesMax doit être un nombre positif." },
      { status: 400 }
    );
  }
  const NIVEAUX_VALIDES = ["DEBUTANT", "INTERMEDIAIRE", "AVANCE", "TOUS_NIVEAUX"];
  if (!NIVEAUX_VALIDES.includes(niveauRequis)) {
    return NextResponse.json({ error: "Niveau requis invalide." }, { status: 400 });
  }

  const sport = await prisma.sport.findUnique({ where: { id: sportId } });
  if (!sport) {
    return NextResponse.json({ error: "Sport invalide." }, { status: 400 });
  }

  const urlsImages: string[] = Array.isArray(images) ? images.slice(0, NOMBRE_MAX_IMAGES) : [];

  const evenement = await prisma.evenement.create({
    data: {
      organisateurId: session.organisateurId,
      nom,
      sportId,
      lieu,
      date: new Date(date),
      placesMax,
      description,
      niveauRequis,
      clubRequis: typeof clubRequis === "boolean" ? clubRequis : false,
      ageMin: typeof ageMin === "number" ? ageMin : null,
      ageMax: typeof ageMax === "number" ? ageMax : null,
      nombreEquipesMax: typeof nombreEquipesMax === "number" ? nombreEquipesMax : null,
      equipementFourni: equipementFourni || null,
      fraisInscription: typeof fraisInscription === "number" ? fraisInscription : 0,
      images: {
        create: urlsImages.map((url, index) => ({ url, ordre: index })),
      },
    },
    include: { images: true },
  });

  return NextResponse.json(evenement, { status: 201 });
}
