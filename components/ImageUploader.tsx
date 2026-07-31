"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ImagePlus, Loader2, X } from "lucide-react";

const NOMBRE_MAX_IMAGES = 4;
const TAILLE_MAX_FICHIER = 5 * 1024 * 1024;

export default function ImageUploader({
  dossier,
  value,
  onChange,
}: {
  dossier: "posts" | "evenements";
  value: string[];
  onChange: (urls: string[]) => void;
}) {
  const t = useTranslations("commun");
  const tErr = useTranslations("erreurs");
  const inputRef = useRef<HTMLInputElement>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleFichiers(fichiers: FileList | null) {
    if (!fichiers || fichiers.length === 0) return;
    setErreur(null);

    const liste = Array.from(fichiers);
    if (value.length + liste.length > NOMBRE_MAX_IMAGES) {
      setErreur(tErr("maxImages", { n: NOMBRE_MAX_IMAGES }));
      return;
    }
    for (const f of liste) {
      if (f.size > TAILLE_MAX_FICHIER) {
        setErreur(tErr("fichierTropLourd", { nom: f.name }));
        return;
      }
    }

    setChargement(true);
    const formData = new FormData();
    liste.forEach((f) => formData.append("files", f));

    const res = await fetch(`/api/upload?dossier=${dossier}`, {
      method: "POST",
      body: formData,
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? t("echecEnvoiImages"));
      return;
    }
    const data = await res.json();
    onChange([...value, ...data.urls]);
    if (inputRef.current) inputRef.current.value = "";
  }

  function retirer(url: string) {
    onChange(value.filter((u) => u !== url));
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => retirer(url)}
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-white"
                style={{ background: "var(--danger)" }}
                aria-label={t("retirerImage")}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {value.length < NOMBRE_MAX_IMAGES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={chargement}
          className="btn btn-secondary self-start"
        >
          {chargement ? <Loader2 size={16} className="animate-spin" /> : <ImagePlus size={16} />}
          {chargement ? t("envoiImagesEnCours") : t("ajouterImages")}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => handleFichiers(e.target.files)}
      />

      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
    </div>
  );
}
