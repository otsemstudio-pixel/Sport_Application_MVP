"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

type JourHeatmap = { jour: number; nombreSeances: number };

type SerieDetail = {
  id: string;
  numeroSerie: number;
  repetitions: number | null;
  dureeSecondes: number | null;
  distanceMetres: number | null;
};
type ExerciceRealiseDetail = { id: string; exercice: { nom: string; uniteMesure: string }; series: SerieDetail[] };
type SeanceDetail = { id: string; date: string; noteOptionnelle: string | null; exercicesRealises: ExerciceRealiseDetail[] };

function valeurPrincipale(s: SerieDetail, uniteMesure: string) {
  if (uniteMesure === "DUREE_SECONDES") return s.dureeSecondes;
  if (uniteMesure === "DISTANCE_METRES") return s.distanceMetres;
  return s.repetitions;
}

function niveauIntensite(n: number) {
  if (n === 0) return 0;
  if (n === 1) return 1;
  if (n === 2) return 2;
  if (n === 3) return 3;
  return 4;
}

const OPACITES = [0, 0.28, 0.5, 0.72, 1];

export default function CalendrierRegularite() {
  const t = useTranslations("entrainement");
  const locale = useLocale();

  const [moisAffiche, setMoisAffiche] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [donnees, setDonnees] = useState<JourHeatmap[]>([]);
  const [chargement, setChargement] = useState(false);
  const [jourSelectionne, setJourSelectionne] = useState<number | null>(null);
  const [seancesJour, setSeancesJour] = useState<SeanceDetail[] | null>(null);

  useEffect(() => {
    setChargement(true);
    fetch(`/api/heatmap?annee=${moisAffiche.getFullYear()}&mois=${moisAffiche.getMonth() + 1}`)
      .then((res) => res.json())
      .then((data) => setDonnees(data.jours ?? []))
      .finally(() => setChargement(false));
  }, [moisAffiche]);

  const nombreParJour = new Map(donnees.map((d) => [d.jour, d.nombreSeances]));
  const nombreJoursDansMois = new Date(moisAffiche.getFullYear(), moisAffiche.getMonth() + 1, 0).getDate();
  const premierJourSemaine = (new Date(moisAffiche.getFullYear(), moisAffiche.getMonth(), 1).getDay() + 6) % 7; // lundi = 0

  async function ouvrirJour(jour: number) {
    setJourSelectionne(jour);
    setSeancesJour(null);
    const dateStr = `${moisAffiche.getFullYear()}-${String(moisAffiche.getMonth() + 1).padStart(2, "0")}-${String(jour).padStart(2, "0")}`;
    const res = await fetch(`/api/seances-entrainement?date=${dateStr}`);
    if (res.ok) setSeancesJour(await res.json());
  }

  function moisPrecedent() {
    setMoisAffiche((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  function moisSuivant() {
    setMoisAffiche((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const labelMois = moisAffiche.toLocaleDateString(locale, { month: "long", year: "numeric" });

  return (
    <div className="card flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("calendrierRegularite")}</h2>
        <div className="flex items-center gap-1">
          <button onClick={moisPrecedent} className="btn btn-ghost !p-1.5" aria-label="précédent">
            <ChevronLeft size={16} />
          </button>
          <span className="min-w-24 text-center text-sm font-medium capitalize">{labelMois}</span>
          <button onClick={moisSuivant} className="btn btn-ghost !p-1.5" aria-label="suivant">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className={`grid grid-cols-7 gap-1.5 ${chargement ? "opacity-50" : ""}`}>
        {Array.from({ length: premierJourSemaine }).map((_, i) => (
          <div key={`vide-${i}`} />
        ))}
        {Array.from({ length: nombreJoursDansMois }).map((_, i) => {
          const jour = i + 1;
          const n = nombreParJour.get(jour) ?? 0;
          const niveau = niveauIntensite(n);
          return (
            <button
              key={jour}
              onClick={() => n > 0 && ouvrirJour(jour)}
              disabled={n === 0}
              className="flex aspect-square items-center justify-center rounded-md text-[11px] font-medium transition-transform"
              style={{
                background: niveau === 0 ? "var(--surface-hover)" : "var(--primary)",
                opacity: niveau === 0 ? 1 : OPACITES[niveau],
                color: niveau >= 3 ? "var(--primary-foreground)" : "var(--muted)",
                cursor: n > 0 ? "pointer" : "default",
              }}
              title={t("nombreSeances", { n })}
            >
              {jour}
            </button>
          );
        })}
      </div>

      {jourSelectionne !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center"
          onClick={() => setJourSelectionne(null)}
        >
          <div
            className="card flex max-h-[80vh] w-full max-w-md flex-col gap-3 overflow-y-auto p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                {jourSelectionne} {labelMois}
              </h3>
              <button onClick={() => setJourSelectionne(null)} className="btn btn-ghost !p-1.5" aria-label="fermer">
                <X size={16} />
              </button>
            </div>
            {seancesJour === null ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {t("chargementEnCours")}
              </p>
            ) : (
              seancesJour.map((s) => (
                <div key={s.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                  <ul className="flex flex-col gap-1 text-sm">
                    {s.exercicesRealises.map((er) => (
                      <li key={er.id}>
                        {er.series
                          .map((serie) => valeurPrincipale(serie, er.exercice.uniteMesure) ?? "-")
                          .join("/")}{" "}
                        {t(`unites.${er.exercice.uniteMesure}`)} <span className="font-medium">{er.exercice.nom}</span>
                      </li>
                    ))}
                  </ul>
                  {s.noteOptionnelle && (
                    <p className="mt-1.5 text-xs italic" style={{ color: "var(--muted)" }}>
                      {s.noteOptionnelle}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
