import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { auteurIdSession, resoudreNomsAuteurs } from "@/lib/posts";
import { INCLUDE_ARTICLE_RELATIONS, formaterArticle, idsArticlesLikesParSession } from "@/lib/articles";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: INCLUDE_ARTICLE_RELATIONS,
  });
  if (!article) {
    return NextResponse.json({ error: t("articleIntrouvable") }, { status: 404 });
  }

  await prisma.articleVue.upsert({
    where: {
      articleId_spectateurId_spectateurType: {
        articleId: article.id,
        spectateurId: auteurIdSession(session),
        spectateurType: session.role,
      },
    },
    update: {},
    create: { articleId: article.id, spectateurId: auteurIdSession(session), spectateurType: session.role },
  });

  const commentaires = await prisma.articleCommentaire.findMany({
    where: { articleId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs(commentaires);
  const idsLikesParMoi = await idsArticlesLikesParSession([article.id], session);
  const fallbackNom = tCommun("utilisateur");

  return NextResponse.json({
    ...formaterArticle(article, idsLikesParMoi),
    commentaires: commentaires.map((c) => ({
      id: c.id,
      auteurType: c.auteurType,
      auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
      contenu: c.contenu,
      createdAt: c.createdAt,
    })),
  });
}
