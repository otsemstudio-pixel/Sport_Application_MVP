"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Send } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";

export default function PostComposer() {
  const router = useRouter();
  const t = useTranslations("fil");
  const tCommun = useTranslations("commun");
  const [contenu, setContenu] = useState("");
  const [images, setImages] = useState<string[]>([]);
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
      body: JSON.stringify({ contenu, images }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }

    setContenu("");
    setImages([]);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-4">
      <textarea
        value={contenu}
        onChange={(e) => setContenu(e.target.value)}
        placeholder={t("placeholderComposer")}
        maxLength={500}
        rows={3}
        className="input resize-none"
      />
      <ImageUploader dossier="posts" value={images} onChange={setImages} />
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      <div className="flex items-center justify-end">
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
            {chargement ? t("publicationEnCours") : t("publier")}
          </button>
        </div>
      </div>
    </form>
  );
}
