import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { comprimerEtUploaderImage, NOMBRE_MAX_IMAGES, TAILLE_MAX_FICHIER } from "@/lib/upload";

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: t("introuvable") }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json({ error: t("mineurNonConsentiImage") }, { status: 403 });
    }
  }

  const dossierParam = req.nextUrl.searchParams.get("dossier");
  const dossier = dossierParam === "evenements" ? "evenements" : dossierParam === "profils" ? "profils" : "posts";

  const formData = await req.formData();
  const fichiers = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (fichiers.length === 0) {
    return NextResponse.json({ error: t("aucunFichier") }, { status: 400 });
  }
  if (fichiers.length > NOMBRE_MAX_IMAGES) {
    return NextResponse.json(
      { error: t("maxImages", { n: NOMBRE_MAX_IMAGES }) },
      { status: 400 }
    );
  }
  for (const fichier of fichiers) {
    if (fichier.size > TAILLE_MAX_FICHIER) {
      return NextResponse.json(
        { error: t("fichierTropLourd", { nom: fichier.name }) },
        { status: 400 }
      );
    }
    if (!fichier.type.startsWith("image/")) {
      return NextResponse.json(
        { error: t("fichierPasImage", { nom: fichier.name }) },
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
