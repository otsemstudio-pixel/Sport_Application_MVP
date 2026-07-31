"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Heart, MessageCircle, Send, ShieldCheck, Trash2, UserRound } from "lucide-react";

export type Post = {
  id: string;
  auteurType: "ATHLETE" | "ORGANISATEUR";
  auteurNom: string;
  contenu: string;
  imageUrl: string | null;
  createdAt: string;
  nombreLikes: number;
  nombreCommentaires: number;
  likeParMoi: boolean;
  auteurCestMoi: boolean;
};

type Commentaire = {
  id: string;
  auteurType: "ATHLETE" | "ORGANISATEUR";
  auteurNom: string;
  contenu: string;
  createdAt: string;
};

export default function PostCard({ post }: { post: Post }) {
  const router = useRouter();
  const [liked, setLiked] = useState(post.likeParMoi);
  const [nbLikes, setNbLikes] = useState(post.nombreLikes);
  const [nbCommentaires, setNbCommentaires] = useState(post.nombreCommentaires);
  const [afficherCommentaires, setAfficherCommentaires] = useState(false);
  const [commentaires, setCommentaires] = useState<Commentaire[] | null>(null);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [supprime, setSupprime] = useState(false);

  async function toggleLike() {
    const prochainEtat = !liked;
    setLiked(prochainEtat);
    setNbLikes((n) => n + (prochainEtat ? 1 : -1));
    const res = await fetch(`/api/posts/${post.id}/like`, { method: "POST" });
    if (!res.ok) {
      setLiked(!prochainEtat);
      setNbLikes((n) => n - (prochainEtat ? 1 : -1));
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
    }
  }

  async function ouvrirCommentaires() {
    setAfficherCommentaires((v) => !v);
    if (commentaires === null) {
      const res = await fetch(`/api/posts/${post.id}/commentaires`);
      if (res.ok) setCommentaires(await res.json());
    }
  }

  async function envoyerCommentaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) return;
    setErreur(null);

    const res = await fetch(`/api/posts/${post.id}/commentaires`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: nouveauCommentaire }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    const commentaire = await res.json();
    setCommentaires((prev) => [...(prev ?? []), commentaire]);
    setNbCommentaires((n) => n + 1);
    setNouveauCommentaire("");
  }

  async function supprimerPost() {
    const res = await fetch(`/api/posts/${post.id}`, { method: "DELETE" });
    if (res.ok) {
      setSupprime(true);
      router.refresh();
    }
  }

  if (supprime) return null;

  return (
    <div className="card flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {post.auteurNom.trim()[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold">{post.auteurNom}</span>
              <span className={`chip ${post.auteurType === "ORGANISATEUR" ? "chip-gold" : "chip-neutral"}`}>
                {post.auteurType === "ORGANISATEUR" ? (
                  <ShieldCheck size={11} />
                ) : (
                  <UserRound size={11} />
                )}
                {post.auteurType === "ORGANISATEUR" ? "Organisateur" : "Athlète"}
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {new Date(post.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>
        {post.auteurCestMoi && (
          <button onClick={supprimerPost} aria-label="Supprimer" className="btn btn-ghost !p-1.5">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.contenu}</p>

      {post.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.imageUrl} alt="" className="max-h-80 w-full rounded-xl object-cover" />
      )}

      {erreur && <p className="chip chip-danger self-start">{erreur}</p>}

      <div className="flex items-center gap-4 border-t pt-3" style={{ borderColor: "var(--border)" }}>
        <button onClick={toggleLike} className="flex items-center gap-1.5 text-sm">
          <Heart
            size={17}
            fill={liked ? "var(--primary)" : "none"}
            style={{ color: liked ? "var(--primary)" : "var(--muted)" }}
          />
          <span style={{ color: liked ? "var(--primary)" : "var(--muted)" }}>{nbLikes}</span>
        </button>
        <button onClick={ouvrirCommentaires} className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
          <MessageCircle size={17} />
          {nbCommentaires}
        </button>
      </div>

      {afficherCommentaires && (
        <div className="flex flex-col gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          {commentaires === null && (
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              Chargement…
            </p>
          )}
          {commentaires?.map((c) => (
            <div key={c.id} className="text-sm">
              <span className="font-semibold">{c.auteurNom}</span>{" "}
              <span style={{ color: "var(--foreground)" }}>{c.contenu}</span>
            </div>
          ))}
          <form onSubmit={envoyerCommentaire} className="flex gap-2 pt-1">
            <input
              value={nouveauCommentaire}
              onChange={(e) => setNouveauCommentaire(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="input flex-1 !py-1.5 text-sm"
            />
            <button type="submit" className="btn btn-primary !px-3">
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
