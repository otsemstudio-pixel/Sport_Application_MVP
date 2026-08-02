"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";

type ThemeFond = "CLAIR" | "SOMBRE" | "SPORT";
type PreferenceEffets = "AUTO" | "DEGRADE" | "COMPLET";

export default function ParametresApparence({
  themeFondInitial,
  preferenceEffetsInitiale,
  afficherFondSportInitial,
  netteteFondSportInitiale,
}: {
  themeFondInitial: ThemeFond;
  preferenceEffetsInitiale: PreferenceEffets;
  afficherFondSportInitial: boolean;
  netteteFondSportInitiale: number;
}) {
  const router = useRouter();
  const t = useTranslations("apparence");
  const [themeFond, setThemeFond] = useState(themeFondInitial);
  const [effets, setEffets] = useState(preferenceEffetsInitiale);
  const [afficherFondSport, setAfficherFondSport] = useState(afficherFondSportInitial);
  const [nettete, setNettete] = useState(netteteFondSportInitiale);
  const [chargement, setChargement] = useState(false);

  async function sauvegarder(champ: string, valeur: string | boolean | number) {
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

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="field-label">{t("fondSportLabel")}</span>
          <button
            role="switch"
            aria-checked={afficherFondSport}
            disabled={chargement}
            onClick={() => {
              const nouvelleValeur = !afficherFondSport;
              setAfficherFondSport(nouvelleValeur);
              sauvegarder("afficherFondSport", nouvelleValeur);
            }}
            className="pill-toggle-btn"
            style={{ background: afficherFondSport ? "var(--primary)" : "var(--surface-hover)", color: afficherFondSport ? "var(--primary-foreground)" : "var(--muted)" }}
          >
            {afficherFondSport ? t("active") : t("inactive")}
          </button>
        </div>
        {afficherFondSport && (
          <label className="field-label">
            {t("netteteLabel", { valeur: nettete })}
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={nettete}
              disabled={chargement}
              onChange={(e) => setNettete(Number(e.target.value))}
              onMouseUp={() => sauvegarder("netteteFondSport", nettete)}
              onTouchEnd={() => sauvegarder("netteteFondSport", nettete)}
              className="w-full accent-[var(--primary)]"
            />
          </label>
        )}
        <Link href="/credits-photos" className="text-xs self-start" style={{ color: "var(--muted)" }}>
          {t("creditsPhotos")}
        </Link>
      </div>
    </div>
  );
}
