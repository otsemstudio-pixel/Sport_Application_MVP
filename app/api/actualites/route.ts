import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formaterActualite } from "@/lib/actualites";
import type { CategorieActualite } from "@/app/generated/prisma/client";

const PAGE_SIZE = 15;
const CATEGORIES_VALIDES: CategorieActualite[] = ["RESULTAT_TOURNOI", "BOURSE_OPPORTUNITE", "SELECTION_NATIONALE", "GENERAL"];

// Lit uniquement notre base de données, jamais NewsData.io/RSS en direct —
// la récupération se fait exclusivement via le job cron
// (app/api/cron/actualites), pour ne jamais consommer le quota externe à
// chaque ouverture de l'écran par un utilisateur.
export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const categorieParam = req.nextUrl.searchParams.get("categorie");
  const categorie = CATEGORIES_VALIDES.includes(categorieParam as CategorieActualite)
    ? (categorieParam as CategorieActualite)
    : undefined;
  const sportId = req.nextUrl.searchParams.get("sportId") ?? undefined;

  const actualites = await prisma.actualite.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: {
      ...(categorie ? { categorie } : {}),
      ...(sportId ? { sportId } : {}),
    },
    orderBy: { publieLe: "desc" },
  });

  return NextResponse.json({
    actualites: actualites.map((a) => {
      const f = formaterActualite(a);
      return { ...f, publieLe: f.publieLe.toISOString() };
    }),
    nextCursor: actualites.length === PAGE_SIZE ? actualites[actualites.length - 1].id : null,
  });
}
