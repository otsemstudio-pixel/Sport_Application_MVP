"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

export default function LikeButton({
  postId,
  likeInitial,
  nombreInitial,
  size = 17,
  flottant = false,
}: {
  postId: string;
  likeInitial: boolean;
  nombreInitial: number;
  size?: number;
  flottant?: boolean;
}) {
  const [liked, setLiked] = useState(likeInitial);
  const [nombre, setNombre] = useState(nombreInitial);

  async function toggleLike(e: React.MouseEvent) {
    e.stopPropagation();
    const prochainEtat = !liked;
    setLiked(prochainEtat);
    setNombre((n) => n + (prochainEtat ? 1 : -1));
    const res = await fetch(`/api/posts/${postId}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(!prochainEtat);
      setNombre((n) => n - (prochainEtat ? 1 : -1));
    }
  }

  if (flottant) {
    return (
      <button
        onClick={toggleLike}
        aria-label="like"
        className="flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
        style={{
          background: liked ? "var(--primary)" : "color-mix(in srgb, var(--surface) 85%, transparent)",
          color: liked ? "var(--primary-foreground)" : "var(--foreground)",
        }}
      >
        <Heart size={19} fill={liked ? "currentColor" : "none"} />
      </button>
    );
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
