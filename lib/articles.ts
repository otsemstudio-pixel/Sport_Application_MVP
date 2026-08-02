import { prisma } from "@/lib/prisma";
import type { SessionInfo } from "@/lib/auth";
import { auteurIdSession } from "@/lib/posts";

// Relations communes à charger pour afficher un article (liste ou détail).
export const INCLUDE_ARTICLE_RELATIONS = {
  sport: { select: { id: true, nom: true } },
  _count: { select: { likes: true, commentaires: true, vues: true } },
} as const;

export async function idsArticlesLikesParSession(articleIds: string[], session: SessionInfo) {
  const mesLikes = await prisma.articleLike.findMany({
    where: {
      articleId: { in: articleIds },
      auteurId: auteurIdSession(session),
      auteurType: session.role,
    },
    select: { articleId: true },
  });
  return new Set(mesLikes.map((l) => l.articleId));
}

export function formaterArticle(
  article: {
    id: string;
    titre: string;
    chapo: string;
    contenu: string;
    source: string;
    imageUrl: string;
    publieLe: Date;
    sport: { id: string; nom: string };
    _count: { likes: number; commentaires: number; vues: number };
  },
  idsLikesParMoi: Set<string>
) {
  return {
    id: article.id,
    titre: article.titre,
    chapo: article.chapo,
    contenu: article.contenu,
    source: article.source,
    imageUrl: article.imageUrl,
    publieLe: article.publieLe,
    sport: article.sport,
    nombreLikes: article._count.likes,
    nombreCommentaires: article._count.commentaires,
    nombreVues: article._count.vues,
    likeParMoi: idsLikesParMoi.has(article.id),
  };
}
