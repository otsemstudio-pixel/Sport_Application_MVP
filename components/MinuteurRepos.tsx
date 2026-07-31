"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, RotateCcw, TimerOff } from "lucide-react";

export default function MinuteurRepos({ dureeParDefaut = 90 }: { dureeParDefaut?: number }) {
  const t = useTranslations("entrainement");
  const [secondesRestantes, setSecondesRestantes] = useState(dureeParDefaut);

  useEffect(() => {
    if (secondesRestantes <= 0) return;
    const id = setTimeout(() => setSecondesRestantes((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [secondesRestantes]);

  const termine = secondesRestantes <= 0;
  const mm = String(Math.floor(secondesRestantes / 60)).padStart(2, "0");
  const ss = String(secondesRestantes % 60).padStart(2, "0");

  return (
    <div
      className="flex items-center justify-between gap-3 rounded-xl border p-3"
      style={{ borderColor: "var(--border)", background: "var(--surface-hover)" }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold" style={{ color: "var(--muted)" }}>
          {t("minuteurRepos")}
        </span>
        <span
          className="text-lg font-bold tabular-nums"
          style={{ color: termine ? "var(--success)" : "var(--foreground)" }}
        >
          {termine ? t("reposTermine") : `${mm}:${ss}`}
        </span>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setSecondesRestantes((s) => Math.max(0, s - 15))}
          disabled={termine}
          className="btn btn-ghost !p-1.5"
          aria-label="-15s"
        >
          <Minus size={14} />
        </button>
        <button
          type="button"
          onClick={() => setSecondesRestantes((s) => s + 15)}
          className="btn btn-ghost !p-1.5"
          aria-label="+15s"
        >
          <Plus size={14} />
        </button>
        {termine ? (
          <button
            type="button"
            onClick={() => setSecondesRestantes(dureeParDefaut)}
            className="btn btn-secondary !px-2.5 !py-1.5 text-xs"
          >
            <RotateCcw size={13} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSecondesRestantes(0)}
            className="btn btn-secondary !px-2.5 !py-1.5 text-xs"
          >
            <TimerOff size={13} />
            {t("passerRepos")}
          </button>
        )}
      </div>
    </div>
  );
}
