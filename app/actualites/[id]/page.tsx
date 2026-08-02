import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { auteurIdSession, resoudreNomsAuteurs } from "@/lib/posts";
import { INCLUDE_ARTICLE_RELATIONS, formaterArticle, idsArticlesLikesParSession } from "@/lib/articles";
import ArticleLikeButton from "@/components/ArticleLikeButton";
import CommentairesArticle from "@/components/CommentairesArticle";
import { ArrowLeft, Eye } from "lucide-react";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;

  const article = await prisma.article.findUnique({
    where: { id },
    include: INCLUDE_ARTICLE_RELATIONS,
  });
  if (!article) notFound();

  // Enregistre une vue à l'ouverture de la vue détaillée, comme pour un post
  // (contrainte d'unicité en base : pas de double comptage en rouvrant).
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

  const locale = await getLocale();
  const t = await getTranslations("actualites");

  const commentaires = await prisma.articleCommentaire.findMany({
    where: { articleId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs(commentaires);
  const idsLikesParMoi = await idsArticlesLikesParSession([article.id], session);
  const fallbackNom = (await getTranslations("commun"))("utilisateur");
  const articleFormate = formaterArticle(article, idsLikesParMoi);

  const commentairesFormates = commentaires.map((c) => ({
    id: c.id,
    auteurId: c.auteurId,
    auteurType: c.auteurType,
    auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
    contenu: c.contenu,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/actualites" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourActualites")}
      </Link>

      <div className="card flex flex-col gap-4 overflow-hidden p-0">
        <div className="relative h-56 w-full sm:h-72">
          {/* unoptimized : voir ArticleCard.tsx (contournement du blocage 429
              de Wikimedia observé avec de nombreuses images distinctes). */}
          <Image src={articleFormate.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 700px" className="object-cover" unoptimized />
          <span className="chip chip-primary absolute left-3 top-3 max-w-[calc(100%-1.5rem)] truncate">{articleFormate.sport.nom}</span>
        </div>

        <div className="flex flex-col gap-3 px-5 pb-5">
          <h1 className="text-xl font-bold leading-snug">{articleFormate.titre}</h1>
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {new Date(articleFormate.publieLe).toLocaleDateString(locale, {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          <p className="text-[15px] font-medium leading-relaxed" style={{ color: "var(--muted)" }}>
            {articleFormate.chapo}
          </p>
          <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{articleFormate.contenu}</p>

          <p className="text-xs italic" style={{ color: "var(--muted)" }}>
            {t("source")} : {articleFormate.source}
          </p>

          <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
            <ArticleLikeButton articleId={articleFormate.id} likeInitial={articleFormate.likeParMoi} nombreInitial={articleFormate.nombreLikes} size={20} />
            <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
              <Eye size={16} />
              {t("nombreVues", { n: articleFormate.nombreVues })}
            </span>
          </div>
        </div>
      </div>

      <CommentairesArticle articleId={articleFormate.id} commentairesInitiaux={commentairesFormates} />
    </div>
  );
}
