"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Eye, MessageCircle } from "lucide-react";
import ArticleLikeButton from "@/components/ArticleLikeButton";

export type Article = {
  id: string;
  titre: string;
  chapo: string;
  source: string;
  imageUrl: string;
  publieLe: string;
  sport: { id: string; nom: string };
  nombreLikes: number;
  nombreCommentaires: number;
  nombreVues: number;
  likeParMoi: boolean;
};

export default function ArticleCard({ article }: { article: Article }) {
  const router = useRouter();
  const locale = useLocale();

  return (
    <div
      onClick={() => router.push(`/actualites/${article.id}`)}
      className="card flex cursor-pointer flex-col gap-3 overflow-hidden p-4 sm:flex-row"
    >
      <div className="relative h-44 w-full shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-40">
        {/* Beaucoup d'articles (sources Wikimedia Commons distinctes) sur une
            même page : passer par l'optimiseur d'images de Next.js regrouperait
            toutes ces requêtes derrière l'IP unique du serveur, ce qui a
            déclenché un blocage 429 de Wikimedia en test. En laissant le
            navigateur de chaque visiteur charger l'image directement, la charge
            est répartie comme pour une page classique. */}
        <Image src={article.imageUrl} alt="" fill sizes="(max-width: 640px) 100vw, 160px" className="object-cover" unoptimized />
        <span className="chip chip-primary absolute left-2 top-2 max-w-[calc(100%-1rem)] truncate">{article.sport.nom}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <h3 className="font-semibold leading-snug">{article.titre}</h3>
        <p className="line-clamp-2 text-sm" style={{ color: "var(--muted)" }}>
          {article.chapo}
        </p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-1.5">
          <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--muted)" }}>
            {new Date(article.publieLe).toLocaleDateString(locale, { day: "numeric", month: "short" })} · {article.source}
          </span>
          <div className="ml-auto flex shrink-0 items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <ArticleLikeButton articleId={article.id} likeInitial={article.likeParMoi} nombreInitial={article.nombreLikes} size={15} />
            <span className="chip chip-neutral">
              <MessageCircle size={12} />
              {article.nombreCommentaires}
            </span>
            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--muted)" }}>
              <Eye size={13} />
              {article.nombreVues}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
