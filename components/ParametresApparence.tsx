"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type ThemeFond = "CLAIR" | "SOMBRE" | "SPORT";
type PreferenceEffets = "AUTO" | "DEGRADE" | "COMPLET";

export default function ParametresApparence({
  themeFondInitial,
  preferenceEffetsInitiale,
}: {
  themeFondInitial: ThemeFond;
  preferenceEffetsInitiale: PreferenceEffets;
}) {
  const router = useRouter();
  const t = useTranslations("apparence");
  const [themeFond, setThemeFond] = useState(themeFondInitial);
  const [effets, setEffets] = useState(preferenceEffetsInitiale);
  const [chargement, setChargement] = useState(false);

  async function sauvegarder(champ: "themeFond" | "preferenceEffetsVisuels", valeur: string) {
    setChargement(true);
    const res = await fetch("/api/profil/apparence", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [champ]: valeur }),
    });
    setChargement(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="card flex flex-col gap-4 p-4">
      <h2 className="font-semibold">{t("titre")}</h2>

      <div className="flex flex-col gap-2">
        <span className="field-label">{t("themeFondLabel")}</span>
        <div className="pill-toggle">
          {(["CLAIR", "SOMBRE", "SPORT"] as const).map((v) => (
            <button
              key={v}
              disabled={chargement}
              onClick={() => {
                setThemeFond(v);
                sauvegarder("themeFond", v);
              }}
              className={`pill-toggle-btn ${themeFond === v ? "active" : ""}`}
            >
              {t(`theme.${v}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="field-label">{t("effetsLabel")}</span>
        <div className="pill-toggle">
          {(["AUTO", "DEGRADE", "COMPLET"] as const).map((v) => (
            <button
              key={v}
              disabled={chargement}
              onClick={() => {
                setEffets(v);
                sauvegarder("preferenceEffetsVisuels", v);
              }}
              className={`pill-toggle-btn ${effets === v ? "active" : ""}`}
            >
              {t(`effets.${v}`)}
            </button>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {t("effetsDescription")}
        </p>
      </div>
    </div>
  );
}
