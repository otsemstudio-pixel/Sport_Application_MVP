"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
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
  const [articles, setArticles] = useState(articlesInitiaux);
  const [curseur, setCurseur] = useState(curseurInitial);
  const [chargement, setChargement] = useState(false);

  const matchsFiltres = useMemo(
    () => (sportId ? matchsInitiaux.filter((m) => m.sport.id === sportId) : matchsInitiaux),
    [matchsInitiaux, sportId]
  );

  async function changerSport(nouveauSportId: string | null) {
    if (nouveauSportId === sportId || chargement) return;
    setSportId(nouveauSportId);
    setChargement(true);
    const params = new URLSearchParams();
    if (nouveauSportId) params.set("sport", nouveauSportId);
    const res = await fetch(`/api/articles?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setArticles(data.articles);
    setCurseur(data.nextCursor);
  }

  async function chargerPlus() {
    if (!curseur) return;
    setChargement(true);
    const params = new URLSearchParams({ cursor: curseur });
    if (sportId) params.set("sport", sportId);
    const res = await fetch(`/api/articles?${params.toString()}`);
    setChargement(false);
    if (!res.ok) return;
    const data = await res.json();
    setArticles((prev) => [...prev, ...data.articles]);
    setCurseur(data.nextCursor);
  }

  return (
    <div className="flex min-w-0 flex-col gap-5">
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
            {t("aucunArticle")}
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
