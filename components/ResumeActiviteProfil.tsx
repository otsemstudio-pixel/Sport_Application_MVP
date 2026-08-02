"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type PointJour = { date: string; nombreSeances: number };
type PointSemaine = { semaineDebut: string; nombreSeances: number };

export default function ResumeActiviteProfil({
  donneesSemaine,
  donneesMois,
}: {
  donneesSemaine: PointJour[];
  donneesMois: PointSemaine[];
}) {
  const t = useTranslations("activiteProfil");
  const locale = useLocale();
  const [vue, setVue] = useState<"semaine" | "mois">("semaine");

  const totalSemaine = donneesSemaine.reduce((s, p) => s + p.nombreSeances, 0);
  const totalMois = donneesMois.reduce((s, p) => s + p.nombreSeances, 0);

  const donnees =
    vue === "semaine"
      ? donneesSemaine.map((p) => ({ label: new Date(p.date).toLocaleDateString(locale, { weekday: "short" }), valeur: p.nombreSeances }))
      : donneesMois.map((p) => ({ label: new Date(p.semaineDebut).toLocaleDateString(locale, { day: "numeric", month: "short" }), valeur: p.nombreSeances }));

  const total = vue === "semaine" ? totalSemaine : totalMois;
  const aucuneActivite = total === 0;

  return (
    <div className="card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold">{t("titre")}</h2>
        <div className="pill-toggle">
          {(["semaine", "mois"] as const).map((v) => (
            <button key={v} onClick={() => setVue(v)} className={`pill-toggle-btn ${vue === v ? "active" : ""}`}>
              {t(v)}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {t("totalSeances", { n: total })}
      </p>

      {aucuneActivite ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t("aucuneActivite")}
        </p>
      ) : (
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <BarChart data={donnees}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} stroke="var(--muted)" />
              <YAxis fontSize={11} stroke="var(--muted)" width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [value, t("seances")]}
              />
              <Bar dataKey="valeur" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
