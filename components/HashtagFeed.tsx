"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PostCard, { type Post } from "@/components/PostCard";

export default function HashtagFeed({
  tag,
  postsInitiaux,
  curseurInitial,
}: {
  tag: string;
  postsInitiaux: Post[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("hashtag");
  const [posts, setPosts] = useState(postsInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  async function chargerPlus() {
    if (!curseur) return;
    setChargement(true);
    const params = new URLSearchParams({ cursor: curseur });
    const res = await fetch(`/api/hashtags/${tag}?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setPosts((prev) => [...prev, ...data.posts]);
    setCurseur(data.nextCursor);
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.length === 0 && <p className="text-sm" style={{ color: "var(--muted)" }}>{t("aucunPost")}</p>}
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {curseur && (
        <button onClick={chargerPlus} disabled={chargement} className="btn btn-secondary self-center">
          {chargement ? t("chargementEnCours") : t("chargerPlus")}
        </button>
      )}
    </div>
  );
}
