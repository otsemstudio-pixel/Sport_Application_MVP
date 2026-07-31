"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Periode = "1m" | "3m" | "6m" | "tout";
type PointRecord = { date: string; valeur: number };
type PointVolume = { semaineDebut: string; total: number };
type Progression = {
  exerciceNom: string;
  uniteMesure: string;
  recordDansLeTemps: PointRecord[];
  volumeParSemaine: PointVolume[];
};

export default function GraphiquesExercice({ exerciceId }: { exerciceId: string }) {
  const t = useTranslations("exercices");
  const tEntrainement = useTranslations("entrainement");
  const locale = useLocale();

  const [periode, setPeriode] = useState<Periode>("3m");
  const [data, setData] = useState<Progression | null>(null);
  const [chargement, setChargement] = useState(false);

  useEffect(() => {
    setChargement(true);
    fetch(`/api/exercices/${exerciceId}/progression?periode=${periode}`)
      .then((res) => res.json())
      .then(setData)
      .finally(() => setChargement(false));
  }, [exerciceId, periode]);

  function formaterDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { day: "numeric", month: "short" });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="pill-toggle">
        {(["1m", "3m", "6m", "tout"] as const).map((p) => (
          <button
            key={p}
            onClick={() => setPeriode(p)}
            className={`pill-toggle-btn ${periode === p ? "active" : ""}`}
          >
            {t(`periode.${p}`)}
          </button>
        ))}
      </div>

      {chargement && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {tEntrainement("chargementEnCours")}
        </p>
      )}

      {!chargement && data && (
        <>
          <div className="card flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold">{t("evolutionRecord")}</h3>
            {data.recordDansLeTemps.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {t("pasAssezDeDonnees")}
              </p>
            ) : (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <LineChart data={data.recordDansLeTemps.map((p) => ({ ...p, dateLabel: formaterDate(p.date) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="dateLabel" fontSize={11} stroke="var(--muted)" />
                    <YAxis fontSize={11} stroke="var(--muted)" width={40} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [`${value} ${tEntrainement(`unites.${data.uniteMesure}`)}`, t("evolutionRecord")]}
                    />
                    <Line type="stepAfter" dataKey="valeur" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="card flex flex-col gap-3 p-4">
            <h3 className="text-sm font-semibold">{t("volumeParSemaine")}</h3>
            {data.volumeParSemaine.length === 0 ? (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                {t("pasAssezDeDonnees")}
              </p>
            ) : (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer>
                  <BarChart data={data.volumeParSemaine.map((p) => ({ ...p, dateLabel: formaterDate(p.semaineDebut) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="dateLabel" fontSize={11} stroke="var(--muted)" />
                    <YAxis fontSize={11} stroke="var(--muted)" width={40} />
                    <Tooltip
                      contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                      formatter={(value) => [`${value} ${tEntrainement(`unites.${data.uniteMesure}`)}`, t("volumeParSemaine")]}
                    />
                    <Bar dataKey="total" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
