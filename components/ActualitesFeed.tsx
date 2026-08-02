"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import ArticleCard, { type Article } from "@/components/ArticleCard";
import MatchScoreCard, { type MatchDemo } from "@/components/MatchScoreCard";

type Sport = { id: string; nom: string };

export default function ActualitesFeed({
  sports,
  matchsInitiaux,
  articlesInitiaux,
  curseurInitial,
}: {
  sports: Sport[];
  matchsInitiaux: MatchDemo[];
  articlesInitiaux: Article[];
  curseurInitial: string | null;
}) {
  const t = useTranslations("actualites");
  const [sportId, setSportId] = useState<string | null>(null);
  const [recherche, setRecherche] = useState("");
  const [articles, setArticles] = useState(articlesInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);
  const premierRendu = useRef(true);

  const matchsFiltres = useMemo(
    () => (sportId ? matchsInitiaux.filter((m) => m.sport.id === sportId) : matchsInitiaux),
    [matchsInitiaux, sportId]
  );

  async function charger(cursorActuel: string | null, sportActuel: string | null, rechercheActuelle: string, remplacer: boolean) {
    setChargement(true);
    const params = new URLSearchParams();
    if (cursorActuel) params.set("cursor", cursorActuel);
    if (sportActuel) params.set("sport", sportActuel);
    if (rechercheActuelle.trim()) params.set("q", rechercheActuelle.trim());
    const res = await fetch(`/api/articles?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setArticles((prev) => (remplacer ? data.articles : [...prev, ...data.articles]));
    setCurseur(data.nextCursor);
  }

  // Débounce : évite un appel API à chaque frappe au clavier.
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }
    const id = setTimeout(() => {
      charger(null, sportId, recherche, true);
    }, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recherche]);

  function changerSport(nouveauSportId: string | null) {
    if (nouveauSportId === sportId || chargement) return;
    setSportId(nouveauSportId);
    charger(null, nouveauSportId, recherche, true);
  }

  function chargerPlus() {
    if (!curseur) return;
    charger(curseur, sportId, recherche, false);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2"
          style={{ color: "var(--muted)" }}
        />
        <input
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder={t("rechercherPlaceholder")}
          className="input w-full !pl-10 !pr-9"
        />
        {recherche && (
          <button
            onClick={() => setRecherche("")}
            aria-label={t("effacerRecherche")}
            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full surface-hover"
            style={{ color: "var(--muted)" }}
          >
            <X size={14} />
          </button>
        )}
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

      {matchsFiltres.length > 0 && (
        <div className="flex min-w-0 flex-col gap-2.5">
          <h2 className="text-sm font-semibold" style={{ color: "var(--muted)" }}>
            {t("scoresEnDirect")}
          </h2>
          <div className="-mx-4 flex min-w-0 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
            {matchsFiltres.map((m) => (
              <MatchScoreCard key={m.id} match={m} />
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {articles.length === 0 && !chargement && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {recherche.trim() ? t("aucunResultat") : t("aucunArticle")}
          </p>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
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
