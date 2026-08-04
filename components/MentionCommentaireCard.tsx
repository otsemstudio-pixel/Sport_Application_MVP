"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, MessageCircle } from "lucide-react";
import TexteEnrichi from "@/components/TexteEnrichi";

export type MentionCommentaire = {
  id: string;
  postId: string;
  auteurNom: string;
  contenu: string;
  createdAt: string;
};

// Une mention dans un commentaire n'a pas de page dédiée : mène vers le post
// parent (le commentaire n'a pas d'ancre propre pour l'instant).
export default function MentionCommentaireCard({ commentaire }: { commentaire: MentionCommentaire }) {
  const locale = useLocale();
  const t = useTranslations("mentions");

  return (
    <Link href={`/posts/${commentaire.postId}`} className="card surface-hover flex flex-col gap-2 p-4">
      <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
        <MessageCircle size={13} />
        <span className="font-semibold" style={{ color: "var(--foreground)" }}>
          {commentaire.auteurNom}
        </span>
        <span>
          {new Date(commentaire.createdAt).toLocaleDateString(locale, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      <p className="text-sm leading-relaxed">
        <TexteEnrichi texte={commentaire.contenu} />
      </p>
      <span className="flex items-center gap-1 text-xs" style={{ color: "var(--primary)" }}>
        {t("voirLePost")}
        <ArrowRight size={12} />
      </span>
    </Link>
  );
}
