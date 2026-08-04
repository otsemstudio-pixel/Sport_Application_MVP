import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { resoudreMentionsPourTextes } from "@/lib/hashtagsMentions";

// Résout une liste de @nomUtilisateur (envoyés en texte brut, pas déjà
// extraits) vers les comptes réels — utilisée par le rendu client des
// hashtags/mentions dans le texte des posts/commentaires (components/TexteEnrichi.tsx).
export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const textes = req.nextUrl.searchParams.getAll("texte");
  const resolues = await resoudreMentionsPourTextes(textes);

  return NextResponse.json(Object.fromEntries(resolues));
}
