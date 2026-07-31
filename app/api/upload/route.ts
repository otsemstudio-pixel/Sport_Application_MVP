import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { comprimerEtUploaderImage, NOMBRE_MAX_IMAGES, TAILLE_MAX_FICHIER } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json(
        {
          error:
            "Ce profil mineur doit obtenir le consentement parental avant d'ajouter des images.",
        },
        { status: 403 }
      );
    }
  }

  const dossierParam = req.nextUrl.searchParams.get("dossier");
  const dossier = dossierParam === "evenements" ? "evenements" : "posts";

  const formData = await req.formData();
  const fichiers = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (fichiers.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (fichiers.length > NOMBRE_MAX_IMAGES) {
    return NextResponse.json(
      { error: `Maximum ${NOMBRE_MAX_IMAGES} images.` },
      { status: 400 }
    );
  }
  for (const fichier of fichiers) {
    if (fichier.size > TAILLE_MAX_FICHIER) {
      return NextResponse.json(
        { error: `${fichier.name} dépasse la taille maximale de 5 Mo.` },
        { status: 400 }
      );
    }
    if (!fichier.type.startsWith("image/")) {
      return NextResponse.json(
        { error: `${fichier.name} n'est pas une image.` },
        { status: 400 }
      );
    }
  }

  const urls = await Promise.all(
    fichiers.map(async (fichier) => {
      const buffer = Buffer.from(await fichier.arrayBuffer());
      return comprimerEtUploaderImage(buffer, dossier);
    })
  );

  return NextResponse.json({ urls });
}
