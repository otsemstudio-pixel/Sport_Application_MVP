"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function ArticleLikeButton({
  articleId,
  likeInitial,
  nombreInitial,
  size = 17,
}: {
  articleId: string;
  likeInitial: boolean;
  nombreInitial: number;
  size?: number;
}) {
  const [liked, setLiked] = useState(likeInitial);
  const [nombre, setNombre] = useState(nombreInitial);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const prochainEtat = !liked;
    setLiked(prochainEtat);
    setNombre((n) => n + (prochainEtat ? 1 : -1));
    const res = await fetch(`/api/articles/${articleId}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(!prochainEtat);
      setNombre((n) => n - (prochainEtat ? 1 : -1));
    }
  }

  return (
    <button
      onClick={toggleLike}
      className="chip"
      style={{
        background: liked ? "var(--primary-soft)" : "var(--surface-hover)",
        color: liked ? "var(--primary)" : "var(--muted)",
      }}
    >
      <Heart size={size - 3} fill={liked ? "var(--primary)" : "none"} />
      {nombre}
    </button>
  );
}
