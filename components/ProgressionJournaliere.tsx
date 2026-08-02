"use client";

import { useLocale, useTranslations } from "next-intl";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type PointJour = { date: string; nombreSeances: number };

export default function ProgressionJournaliere({ donnees }: { donnees: PointJour[] }) {
  const t = useTranslations("entrainement");
  const locale = useLocale();

  const total = donnees.reduce((s, p) => s + p.nombreSeances, 0);
  const donneesGraphique = donnees.map((p) => ({
    label: new Date(p.date).toLocaleDateString(locale, { day: "numeric", month: "short" }),
    valeur: p.nombreSeances,
  }));

  return (
    <section className="card flex flex-col gap-3 p-5">
      <h2 className="font-semibold">{t("progressionJournaliere")}</h2>
      {total === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t("aucuneSeance")}
        </p>
      ) : (
        <div style={{ width: "100%", height: 200 }}>
          <ResponsiveContainer>
            <LineChart data={donneesGraphique}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="label" fontSize={11} stroke="var(--muted)" interval="preserveStartEnd" />
              <YAxis fontSize={11} stroke="var(--muted)" width={30} allowDecimals={false} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                formatter={(value) => [value, t("statSeances")]}
              />
              <Line type="monotone" dataKey="valeur" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
