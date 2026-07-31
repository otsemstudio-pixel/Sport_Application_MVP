"use client";

import { useState } from "react";
import { AlertCircle, Send } from "lucide-react";

type Commentaire = {
  id: string;
  auteurType: "ATHLETE" | "ORGANISATEUR";
  auteurNom: string;
  contenu: string;
  createdAt: string;
};

export default function CommentairesDetail({
  postId,
  commentairesInitiaux,
}: {
  postId: string;
  commentairesInitiaux: Commentaire[];
}) {
  const [commentaires, setCommentaires] = useState(commentairesInitiaux);
  const [nouveauCommentaire, setNouveauCommentaire] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyerCommentaire(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!nouveauCommentaire.trim()) return;
    setErreur(null);
    setChargement(true);

    const res = await fetch(`/api/posts/${postId}/commentaires`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: nouveauCommentaire }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    const commentaire = await res.json();
    setCommentaires((prev) => [...prev, commentaire]);
    setNouveauCommentaire("");
  }

  return (
    <div className="card flex flex-col gap-3 p-5">
      <h2 className="font-semibold">Commentaires ({commentaires.length})</h2>

      <form onSubmit={envoyerCommentaire} className="flex gap-2">
        <input
          value={nouveauCommentaire}
          onChange={(e) => setNouveauCommentaire(e.target.value)}
          placeholder="Ajouter un commentaire…"
          className="input flex-1"
        />
        <button type="submit" disabled={chargement} className="btn btn-primary !px-3">
          <Send size={15} />
        </button>
      </form>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {commentaires.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Aucun commentaire pour l&apos;instant.
          </p>
        )}
        {commentaires.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5 text-sm">
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
              style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
            >
              {c.auteurNom.trim()[0]?.toUpperCase() ?? "?"}
            </div>
            <div>
              <span className="font-semibold">{c.auteurNom}</span>{" "}
              <span>{c.contenu}</span>
              <div className="text-xs" style={{ color: "var(--muted)" }}>
                {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
