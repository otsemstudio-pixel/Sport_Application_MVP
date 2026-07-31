"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ImagePlus, Send } from "lucide-react";

export default function PostComposer() {
  const router = useRouter();
  const [contenu, setContenu] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [afficherImage, setAfficherImage] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    if (!contenu.trim()) return;

    setChargement(true);
    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu, imageUrl: imageUrl || undefined }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    setContenu("");
    setImageUrl("");
    setAfficherImage(false);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-4">
      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        placeholder="Partage un moment d'entraînement…"
        maxLength={500}
        rows={3}
        className="input resize-none"
      />
      {afficherImage && (
        <input
          type="url"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="URL d'une image (optionnel)"
          className="input"
        />
      )}
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setAfficherImage((v) => !v)}
          className="btn btn-ghost !px-2"
        >
          <ImagePlus size={17} />
        </button>
        <div className="flex items-center gap-3">
          <span className="text-xs" style={{ color: "var(--muted)" }}>
            {contenu.length}/500
          </span>
          <button
            type="submit"
            disabled={chargement || !contenu.trim()}
            className="btn btn-primary"
          >
            <Send size={15} />
            {chargement ? "Publication…" : "Publier"}
          </button>
        </div>
      </div>
    </form>
  );
}
