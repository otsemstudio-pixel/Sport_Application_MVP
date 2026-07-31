"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CalendarDays, Minus, TrendingDown, TrendingUp } from "lucide-react";

type Periode = "jour" | "semaine" | "mois";

type Serie = {
  id: string;
  numeroSerie: number;
  repetitions: number | null;
  poidsKg: number | null;
  dureeSecondes: number | null;
  distanceMetres: number | null;
};
type ExerciceRealise = {
  id: string;
  exercice: { nom: string; uniteMesure: string };
  series: Serie[];
};
type Seance = {
  id: string;
  date: string;
  noteOptionnelle: string | null;
  exercicesRealises: ExerciceRealise[];
};

function valeurPrincipale(s: Serie, uniteMesure: string) {
  if (uniteMesure === "DUREE_SECONDES") return s.dureeSecondes;
  if (uniteMesure === "DISTANCE_METRES") return s.distanceMetres;
  return s.repetitions;
}
type TotalExercice = { exerciceId: string; nom: string; uniteMesure: string; total: number };

type ReponseJour = { periode: "jour"; date: string; seances: Seance[] };
type ReponsePeriode = {
  periode: "semaine" | "mois";
  nombreSeances: number;
  totauxParExercice: TotalExercice[];
  tendancePourcentage?: number | null;
};

export default function StatistiquesEntrainement() {
  const t = useTranslations("statistiques");
  const tEntrainement = useTranslations("entrainement");
  const locale = useLocale();

  const [periode, setPeriode] = useState<Periode>("jour");
  const [data, setData] = useState<ReponseJour | ReponsePeriode | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    setChargement(true);
    fetch(`/api/statistiques?periode=${periode}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setChargement(false));
  }, [periode]);

  function libelleUnite(u: string) {
    return tEntrainement(`unites.${u}`);
  }

  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">{t("titre")}</h2>
        <div className="pill-toggle">
          {(["jour", "semaine", "mois"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`pill-toggle-btn ${periode === p ? "active" : ""}`}
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>

      {chargement && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {tEntrainement("chargementEnCours")}
        </p>
      )}

      {!chargement && data?.periode === "jour" && (
        <div className="flex flex-col gap-3">
          {data.seances.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {t("aucuneSeanceJour")}
            </p>
          ) : (
            data.seances.map((s) => (
              <div key={s.id} className="rounded-lg border p-3" style={{ borderColor: "var(--border)" }}>
                <div className="mb-1.5 flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
                  <CalendarDays size={13} />
                  {new Date(s.date).toLocaleDateString(locale, { hour: "2-digit", minute: "2-digit" })}
                </div>
                <ul className="flex flex-col gap-1 text-sm">
                  {s.exercicesRealises.map((er) => (
                    <li key={er.id}>
                      {er.series
                        .map((serie) => `${valeurPrincipale(serie, er.exercice.uniteMesure) ?? "-"}${serie.poidsKg ? ` @${serie.poidsKg}kg` : ""}`)
                        .join("/")}{" "}
                      {libelleUnite(er.exercice.uniteMesure)} <span className="font-medium">{er.exercice.nom}</span>
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
      )}

      {!chargement && (data?.periode === "semaine" || data?.periode === "mois") && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold">{t("nombreSeancesLabel", { n: data.nombreSeances })}</span>
            {data.periode === "mois" && <Tendance pourcentage={data.tendancePourcentage} t={t} />}
          </div>

          {data.totauxParExercice.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {t("aucuneSeanceJour")}
            </p>
          ) : (
            <div>
              <h3 className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--muted)" }}>
                {t("totalParExercice")}
              </h3>
              <ol className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
                {data.totauxParExercice.map((te) => (
                  <li key={te.exerciceId} className="flex items-center justify-between py-2 text-sm">
                    <span className="font-medium">{te.nom}</span>
                    <span style={{ color: "var(--muted)" }}>
                      {te.total} {libelleUnite(te.uniteMesure)}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Tendance({
  pourcentage,
  t,
}: {
  pourcentage?: number | null;
  t: ReturnType<typeof useTranslations>;
}) {
  if (pourcentage === null || pourcentage === undefined) {
    return (
      <span className="text-xs" style={{ color: "var(--muted)" }}>
        {t("pasAssezDeDonnees")}
      </span>
    );
  }
  const Icon = pourcentage > 0 ? TrendingUp : pourcentage < 0 ? TrendingDown : Minus;
  const couleur = pourcentage > 0 ? "var(--success)" : pourcentage < 0 ? "var(--danger)" : "var(--muted)";
  return (
    <span className="flex items-center gap-1 text-sm font-medium" style={{ color: couleur }}>
      <Icon size={15} />
      {pourcentage > 0 ? "+" : ""}
      {pourcentage}%
    </span>
  );
}
