"use client";

import { useState } from "react";
import PostCard, { type Post } from "@/components/PostCard";

export default function FilFeed({
  postsInitiaux,
  curseurInitial,
}: {
  postsInitiaux: Post[];
  curseurInitial: string | null;
}) {
  const [posts, setPosts] = useState(postsInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  async function chargerPlus() {
    if (!curseur) return;
    setChargement(true);
    const res = await fetch(`/api/posts?cursor=${curseur}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setPosts((prev) => [...prev, ...data.posts]);
    setCurseur(data.nextCursor);
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Aucune publication pour l&apos;instant. Sois le premier à partager un moment !
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
      {curseur && (
        <button
          onClick={chargerPlus}
          disabled={chargement}
          className="btn btn-secondary self-center"
        >
          {chargement ? "Chargement…" : "Charger plus"}
        </button>
      )}
    </div>
  );
}
