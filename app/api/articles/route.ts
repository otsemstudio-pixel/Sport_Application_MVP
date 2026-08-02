import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { INCLUDE_ARTICLE_RELATIONS, formaterArticle, idsArticlesLikesParSession } from "@/lib/articles";

const PAGE_SIZE = 10;

export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const sportId = req.nextUrl.searchParams.get("sport");
  const recherche = req.nextUrl.searchParams.get("q")?.trim();

  const where = {
    ...(sportId ? { sportId } : {}),
    ...(recherche
      ? {
          OR: [
            { titre: { contains: recherche, mode: "insensitive" as const } },
            { chapo: { contains: recherche, mode: "insensitive" as const } },
            { contenu: { contains: recherche, mode: "insensitive" as const } },
            { source: { contains: recherche, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const articles = await prisma.article.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
    orderBy: { publieLe: "desc" },
    include: INCLUDE_ARTICLE_RELATIONS,
  });

  const idsLikesParMoi = await idsArticlesLikesParSession(articles.map((a) => a.id), session);

  return NextResponse.json({
    articles: articles.map((a) => formaterArticle(a, idsLikesParMoi)),
    nextCursor: articles.length === PAGE_SIZE ? articles[articles.length - 1].id : null,
  });
}
