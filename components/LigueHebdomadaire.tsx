"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type Membre = { rang: number; nom: string; xpSemaine: number; moi: boolean };
type Ligue = { groupe: { niveau: number; ville: string } | null; membres: Membre[] };

const MEDAILLES = ["var(--gold)", "#b8bfc7", "#c17a4c"];

export default function LigueHebdomadaire() {
  const t = useTranslations("ligue");
  const [ligue, setLigue] = useState<Ligue | null>(null);

  useEffect(() => {
    fetch("/api/classement/ligue")
      .then((res) => (res.ok ? res.json() : null))
      .then(setLigue)
      .catch(() => {});
  }, []);

  if (!ligue || !ligue.groupe) return null;

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="font-semibold">{t("titre")}</h2>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {t("description", { niveau: ligue.groupe.niveau })}
        </p>
      </div>
      <ol className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
        {ligue.membres.map((m) => (
          <li
            key={m.rang}
            className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm"
            style={m.moi ? { background: "var(--primary-soft)" } : undefined}
          >
            <div className="flex items-center gap-3">
              {m.rang <= 3 ? (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: MEDAILLES[m.rang - 1] }}
                >
                  {m.rang}
                </span>
              ) : (
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
                  style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
                >
                  {m.rang}
                </span>
              )}
              <span className={m.moi ? "font-semibold" : ""}>
                {m.nom} {m.moi && <span style={{ color: "var(--primary)" }}>{t("toi")}</span>}
              </span>
            </div>
            <span style={{ color: "var(--muted)" }}>{t("xp", { n: m.xpSemaine })}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
