"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import ActualiteCard, { type Actualite } from "@/components/ActualiteCard";

type Categorie = Actualite["categorie"];
const CATEGORIES: Categorie[] = ["RESULTAT_TOURNOI", "BOURSE_OPPORTUNITE", "SELECTION_NATIONALE", "GENERAL"];

export default function ActualitesFeed({
  actualitesInitiales,
  curseurInitial,
}: {
  actualitesInitiales: Actualite[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("actualites");
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [actualites, setActualites] = useState(actualitesInitiales);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  async function charger(cursorActuel: string | null, categorieActuelle: Categorie | null, remplacer: boolean) {
    setChargement(true);
    const params = new URLSearchParams();
    if (cursorActuel) params.set("cursor", cursorActuel);
    if (categorieActuelle) params.set("categorie", categorieActuelle);
    const res = await fetch(`/api/actualites?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setActualites((prev) => (remplacer ? data.actualites : [...prev, ...data.actualites]));
    setCurseur(data.nextCursor);
  }

  function changerCategorie(nouvelle: Categorie | null) {
    if (nouvelle === categorie || chargement) return;
    setCategorie(nouvelle);
    charger(null, nouvelle, true);
  }

  function chargerPlus() {
    if (!curseur) return;
    charger(curseur, categorie, false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          onClick={() => changerCategorie(null)}
          disabled={chargement}
          className="chip shrink-0"
          style={{
            background: categorie === null ? "var(--primary)" : "var(--surface-hover)",
            color: categorie === null ? "var(--primary-foreground)" : "var(--muted)",
          }}
        >
          {t("toutesCategories")}
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => changerCategorie(c)}
            disabled={chargement}
            className="chip shrink-0"
            style={{
              background: categorie === c ? "var(--primary)" : "var(--surface-hover)",
              color: categorie === c ? "var(--primary-foreground)" : "var(--muted)",
            }}
          >
            {t(`categorie.${c}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {actualites.length === 0 && !chargement && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucuneActualite")}
          </p>
        )}
        {actualites.map((a) => (
          <ActualiteCard key={a.id} actualite={a} />
        ))}
      </div>

      {curseur && (
        <button onClick={chargerPlus} disabled={chargement} className="btn btn-secondary self-center">
          {chargement ? t("chargementEnCours") : t("chargerPlus")}
        </button>
      )}
    </div>
  );
}
