import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import {
  comprimerEtUploaderImage,
  DIMENSIONS_MIN,
  FORMATS_ACCEPTES,
  NOMBRE_MAX_IMAGES,
  TAILLE_MAX_FICHIER,
  type FormeRecadrage,
} from "@/lib/upload";

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
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

  const formeParam = req.nextUrl.searchParams.get("forme");
  const forme: FormeRecadrage = formeParam === "carre" || formeParam === "large" ? formeParam : "libre";

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
    if (!FORMATS_ACCEPTES.includes(fichier.type.toLowerCase())) {
      return NextResponse.json(
        { error: t("fichierPasImage", { nom: fichier.name }) },
        { status: 400 }
      );
    }
  }

  try {
    const resultats = await Promise.all(
      fichiers.map(async (fichier) => {
        // Buffer.from() refuse un ArrayBuffer partagé (SharedArrayBuffer) :
        // au-delà d'une certaine taille, undici (fetch/FormData de Node)
        // peut renvoyer ce type de buffer depuis File.arrayBuffer(), d'où
        // l'échec systématique sur les fichiers un peu volumineux (photos de
        // téléphone) alors qu'un tout petit fichier de test passait. Passer
        // par un Uint8Array copie les octets et évite le problème.
        const buffer = Buffer.from(new Uint8Array(await fichier.arrayBuffer()));
        return comprimerEtUploaderImage(buffer, dossier, forme);
      })
    );

    const indexTropPetite = resultats.findIndex((r) => "tropPetite" in r);
    if (indexTropPetite !== -1) {
      const min = DIMENSIONS_MIN[forme];
      return NextResponse.json(
        { error: t("fichierTropPetit", { nom: fichiers[indexTropPetite].name, largeur: min.width, hauteur: min.height }) },
        { status: 400 }
      );
    }

    const urls = resultats.map((r) => (r as { url: string }).url);
    return NextResponse.json({ urls });
  } catch {
    // Format d'image illisible par le compresseur serveur (fichier corrompu,
    // variante exotique non convertie côté client) — jamais un crash brut.
    return NextResponse.json({ error: tCommun("echecEnvoiImages") }, { status: 422 });
  }
}
