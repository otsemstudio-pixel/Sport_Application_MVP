"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AlertCircle, Plus } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type Mensuration = { id: string; date: string; poidsKg: number | null; tailleCm: number | null };

export default function MensurationsPanel({ mensurationsInitiales }: { mensurationsInitiales: Mensuration[] }) {
  const t = useTranslations("mensurations");
  const tCommun = useTranslations("commun");
  const locale = useLocale();

  const [mensurations, setMensurations] = useState(mensurationsInitiales);
  const [poidsKg, setPoidsKg] = useState("");
  const [tailleCm, setTailleCm] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function ajouter(e: React.FormEvent) {
    e.preventDefault();
    if (!poidsKg && !tailleCm) return;
    setErreur(null);
    setChargement(true);

    const res = await fetch("/api/mensurations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        poidsKg: poidsKg ? Number(poidsKg) : undefined,
        tailleCm: tailleCm ? Number(tailleCm) : undefined,
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    const nouvelle = await res.json();
    setMensurations((prev) => [...prev, nouvelle]);
    setPoidsKg("");
    setTailleCm("");
  }

  const donneesPoids = mensurations
    .filter((m) => m.poidsKg != null)
    .map((m) => ({ date: m.date, poidsKg: m.poidsKg, dateLabel: new Date(m.date).toLocaleDateString(locale, { day: "numeric", month: "short" }) }));

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={ajouter} className="card flex flex-col gap-3 p-4">
        <h2 className="font-semibold">{t("nouvelleEntree")}</h2>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder={t("poidsKgLabel")}
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
            className="input"
          />
          <input
            type="number"
            step="any"
            placeholder={t("tailleCmLabel")}
            value={tailleCm}
            onChange={(e) => setTailleCm(e.target.value)}
            className="input"
          />
        </div>
        {erreur && (
          <p className="chip chip-danger self-start">
            <AlertCircle size={14} />
            {erreur}
          </p>
        )}
        <button type="submit" disabled={chargement || (!poidsKg && !tailleCm)} className="btn btn-primary self-start">
          <Plus size={15} />
          {t("ajouter")}
        </button>
      </form>

      <div className="card flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold">{t("evolutionPoids")}</h3>
        {donneesPoids.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucuneEntree")}
          </p>
        ) : (
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <LineChart data={donneesPoids}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="dateLabel" fontSize={11} stroke="var(--muted)" />
                <YAxis fontSize={11} stroke="var(--muted)" width={40} domain={["auto", "auto"]} />
                <Tooltip
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                  formatter={(value) => [`${value} kg`, t("poidsKgLabel")]}
                />
                <Line type="monotone" dataKey="poidsKg" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
