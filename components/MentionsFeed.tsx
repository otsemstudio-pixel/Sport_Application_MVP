"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PostCard, { type Post } from "@/components/PostCard";
import MentionCommentaireCard, { type MentionCommentaire } from "@/components/MentionCommentaireCard";

type ItemMention = { type: "post"; post: Post } | { type: "commentaire"; commentaire: MentionCommentaire };

export default function MentionsFeed({
  itemsInitiaux,
  curseurInitial,
}: {
  itemsInitiaux: ItemMention[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("mentions");
  const [items, setItems] = useState(itemsInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  async function chargerPlus() {
    if (!curseur) return;
    setChargement(true);
    const params = new URLSearchParams({ cursor: curseur });
    const res = await fetch(`/api/mentions?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setItems((prev) => [...prev, ...data.items]);
    setCurseur(data.nextCursor);
  }

  return (
    <div className="flex flex-col gap-3">
      {items.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>{t("aucuneMention")}</p>}
      {items.map((item, i) =>
        item.type === "post" ? (
          <PostCard key={`post-${item.post.id}`} post={item.post} />
        ) : (
          <MentionCommentaireCard key={`commentaire-${item.commentaire.id}-${i}`} commentaire={item.commentaire} />
        )
      )}
      {curseur && (
        <button onClick={chargerPlus} disabled={chargement} className="btn btn-secondary self-center">
          {chargement ? t("chargementEnCours") : t("chargerPlus")}
        </button>
      )}
    </div>
  );
}
