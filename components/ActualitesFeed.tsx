"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ActualiteCard, { type Actualite } from "@/components/ActualiteCard";

type Categorie = Actualite["categorie"];
type Sport = { id: string; nom: string };
const CATEGORIES: Categorie[] = ["RESULTAT_TOURNOI", "BOURSE_OPPORTUNITE", "SELECTION_NATIONALE", "GENERAL"];

export default function ActualitesFeed({
  sports,
  actualitesInitiales,
  curseurInitial,
}: {
  sports: Sport[];
  actualitesInitiales: Actualite[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("actualites");
  const [categorie, setCategorie] = useState<Categorie | null>(null);
  const [sportId, setSportId] = useState<string | null>(null);
  const [actualites, setActualites] = useState(actualitesInitiales);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  const nomsSportParId = useMemo(() => new Map(sports.map((s) => [s.id, s.nom])), [sports]);

  async function charger(cursorActuel: string | null, categorieActuelle: Categorie | null, sportActuel: string | null, remplacer: boolean) {
    setChargement(true);
    const params = new URLSearchParams();
    if (cursorActuel) params.set("cursor", cursorActuel);
    if (categorieActuelle) params.set("categorie", categorieActuelle);
    if (sportActuel) params.set("sportId", sportActuel);
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
    charger(null, nouvelle, sportId, true);
  }

  function changerSport(nouveauSportId: string | null) {
    if (nouveauSportId === sportId || chargement) return;
    setSportId(nouveauSportId);
    charger(null, categorie, nouveauSportId, true);
  }

  function chargerPlus() {
    if (!curseur) return;
    charger(curseur, categorie, sportId, false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
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

      <div className="-mx-4 flex min-w-0 gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        <button
          onClick={() => changerSport(null)}
          disabled={chargement}
          className="chip shrink-0"
          style={{
            background: sportId === null ? "var(--primary)" : "var(--surface-hover)",
            color: sportId === null ? "var(--primary-foreground)" : "var(--muted)",
          }}
        >
          {t("tousLesSports")}
        </button>
        {sports.map((s) => (
          <button
            key={s.id}
            onClick={() => changerSport(s.id)}
            disabled={chargement}
            className="chip shrink-0"
            style={{
              background: sportId === s.id ? "var(--primary)" : "var(--surface-hover)",
              color: sportId === s.id ? "var(--primary-foreground)" : "var(--muted)",
            }}
          >
            {s.nom}
          </button>
        ))}
      </div>

      <div className="mt-2 flex flex-col gap-3">
        {actualites.length === 0 && !chargement && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucuneActualite")}
          </p>
        )}
        {actualites.map((a) => (
          <ActualiteCard key={a.id} actualite={a} sportNom={a.sportId ? nomsSportParId.get(a.sportId) : undefined} />
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
