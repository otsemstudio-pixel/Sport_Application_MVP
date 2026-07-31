"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import PostCard, { type Post } from "@/components/PostCard";

type Filtre = "tout" | "abonnements";

export default function FilFeed({
  postsInitiaux,
  curseurInitial,
}: {
  postsInitiaux: Post[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("fil");
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [posts, setPosts] = useState(postsInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  async function charger(cursor: string | null, filtreActuel: Filtre, remplacer: boolean) {
    setChargement(true);
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (filtreActuel === "abonnements") params.set("filtre", "abonnements");
    const res = await fetch(`/api/posts?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setPosts((prev) => (remplacer ? data.posts : [...prev, ...data.posts]));
    setCurseur(data.nextCursor);
  }

  function changerFiltre(nouveau: Filtre) {
    if (nouveau === filtre || chargement) return;
    setFiltre(nouveau);
    charger(null, nouveau, true);
  }

  async function chargerPlus() {
    if (!curseur) return;
    await charger(curseur, filtre, false);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="pill-toggle">
        {(["tout", "abonnements"] as const).map((f) => (
          <button
            key={f}
            onClick={() => changerFiltre(f)}
            disabled={chargement}
            className={`pill-toggle-btn ${filtre === f ? "active" : ""}`}
          >
            {f === "tout" ? t("filtreTout") : t("filtreAbonnements")}
          </button>
        ))}
      </div>

      {posts.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {chargement ? t("chargementEnCours") : filtre === "abonnements" ? t("aucunPostAbonnements") : t("aucunPost")}
        </p>
      )}

      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}

      {curseur && (
        <button
          onClick={chargerPlus}
          disabled={chargement}
          className="btn btn-secondary self-center"
        >
          {chargement ? t("chargementEnCours") : t("chargerPlus")}
        </button>
      )}
    </div>
  );
}
