"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Bookmark } from "lucide-react";

export default function SauvegarderBouton({
  postId,
  sauvegardeInitiale,
  flottant = false,
}: {
  postId: string;
  sauvegardeInitiale: boolean;
  flottant?: boolean;
}) {
  const t = useTranslations("fil");
  const [sauvegarde, setSauvegarde] = useState(sauvegardeInitiale);
  const [chargement, setChargement] = useState(false);

  async function basculer(e: React.MouseEvent) {
    e.stopPropagation();
    if (chargement) return;
    const prochainEtat = !sauvegarde;
    setSauvegarde(prochainEtat);
    setChargement(true);
    const res = await fetch(`/api/posts/${postId}/sauvegarder`, { method: "POST" });
    setChargement(false);
    if (!res.ok) setSauvegarde(!prochainEtat);
  }

  if (flottant) {
    return (
      <button
        onClick={basculer}
        aria-label={sauvegarde ? t("sauvegarde") : t("sauvegarder")}
        className="flex h-9 w-9 items-center justify-center rounded-full shadow-lg transition-transform active:scale-90"
        style={{
          background: sauvegarde ? "var(--gold)" : "color-mix(in srgb, var(--surface) 85%, transparent)",
          color: sauvegarde ? "var(--primary-foreground)" : "var(--foreground)",
        }}
      >
        <Bookmark size={16} fill={sauvegarde ? "currentColor" : "none"} />
      </button>
    );
  }

  return (
    <button
      onClick={basculer}
      className="chip"
      style={{
        background: sauvegarde ? "var(--gold-soft)" : "var(--surface-hover)",
        color: sauvegarde ? "var(--gold)" : "var(--muted)",
      }}
    >
      <Bookmark size={13} fill={sauvegarde ? "currentColor" : "none"} />
      {sauvegarde ? t("sauvegarde") : t("sauvegarder")}
    </button>
  );
}
