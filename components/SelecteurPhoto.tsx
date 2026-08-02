"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Images, ImageOff, Upload, X } from "lucide-react";
import { convertirSiHeic } from "@/lib/heic";

const TAILLE_MAX_FICHIER = 3 * 1024 * 1024;
const FORMATS_ACCEPTES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export default function SelecteurPhoto({
  champ,
  label,
  valeurInitiale,
  galerie,
  rond = false,
}: {
  champ: "avatarUrl" | "bannerUrl" | "fondEcranUrl";
  label: string;
  valeurInitiale: string | null;
  galerie: string[];
  rond?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("apparence");
  const tErr = useTranslations("erreurs");
  const tCommun = useTranslations("commun");
  const inputRef = useRef<HTMLInputElement>(null);
  // Recadrage centré côté serveur vers un ratio fixe pour l'avatar (carré) et
  // la bannière (large) — le fond d'écran reste "libre" car il est déjà
  // recouvert dynamiquement en CSS (background-size: cover) quel que soit
  // son ratio d'origine.
  const forme = champ === "avatarUrl" ? "carre" : champ === "bannerUrl" ? "large" : "libre";
  const [valeur, setValeur] = useState(valeurInitiale);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [galerieOuverte, setGalerieOuverte] = useState(false);

  async function sauvegarder(url: string | null) {
    setChargement(true);
    setErreur(null);
    const res = await fetch("/api/profil/apparence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [champ]: url }),
    });
    setChargement(false);
    if (res.ok) {
      setValeur(url);
      setGalerieOuverte(false);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("echecEnvoiImages"));
    }
  }

  async function handleFichier(fichiers: FileList | null) {
    const fichierBrut = fichiers?.[0];
    if (!fichierBrut) return;
    setChargement(true);
    setErreur(null);

    let fichier: File;
    try {
      fichier = await convertirSiHeic(fichierBrut);
    } catch {
      setChargement(false);
      setErreur(tCommun("echecEnvoiImages"));
      return;
    }

    if (fichier.size > TAILLE_MAX_FICHIER) {
      setChargement(false);
      setErreur(tErr("fichierTropLourd", { nom: fichier.name }));
      return;
    }
    if (!FORMATS_ACCEPTES.includes(fichier.type.toLowerCase())) {
      setChargement(false);
      setErreur(tErr("fichierPasImage", { nom: fichier.name }));
      return;
    }

    const formData = new FormData();
    formData.append("files", fichier);
    const res = await fetch(`/api/upload?dossier=profils&forme=${forme}`, { method: "POST", body: formData });
    if (!res.ok) {
      setChargement(false);
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("echecEnvoiImages"));
      return;
    }
    const data = await res.json();
    await sauvegarder(data.urls[0]);
    if (inputRef.current) inputRef.current.value = "";
  }

  const formePreview = rond ? "h-14 w-14 rounded-full" : "h-14 w-20 rounded-lg";

  return (
    <div className="flex flex-col gap-2">
      <span className="field-label">{label}</span>
      <div className="flex items-center gap-3">
        {valeur ? (
          <div className={`relative shrink-0 overflow-hidden ${formePreview}`}>
            <Image src={valeur} alt="" fill sizes="80px" className="object-cover" />
          </div>
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center ${formePreview}`}
            style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
          >
            <ImageOff size={18} />
          </div>
        )}
        <div className="flex flex-1 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={chargement}
            className="btn btn-secondary !py-1.5 !text-xs"
          >
            <Upload size={13} />
            {t("depuisAppareil")}
          </button>
          {galerie.length > 0 && (
            <button
              type="button"
              onClick={() => setGalerieOuverte(true)}
              disabled={chargement}
              className="btn btn-secondary !py-1.5 !text-xs"
            >
              <Images size={13} />
              {t("depuisGalerie")}
            </button>
          )}
          {valeur && (
            <button
              type="button"
              onClick={() => sauvegarder(null)}
              disabled={chargement}
              className="btn btn-ghost !py-1.5 !text-xs"
            >
              {t("reinitialiser")}
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          hidden
          onChange={(e) => handleFichier(e.target.files)}
        />
      </div>

      <p className="text-[11px]" style={{ color: "var(--muted)" }}>
        {tCommun("formatsAcceptes")}
      </p>

      {erreur && <p className="chip chip-danger self-start">{erreur}</p>}

      {galerieOuverte && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setGalerieOuverte(false)}
        >
          <div
            className="card flex max-h-[70vh] w-full max-w-md flex-col gap-3 overflow-y-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{t("choisirDansGalerie")}</h3>
              <button onClick={() => setGalerieOuverte(false)} className="btn btn-ghost !p-1.5" aria-label="fermer">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {galerie.map((url) => (
                <button key={url} onClick={() => sauvegarder(url)} className="relative h-24 overflow-hidden rounded-lg">
                  <Image src={url} alt="" fill sizes="150px" className="object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
