"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const JOURS = [1, 2, 3, 4, 5, 6, 0] as const; // lundi..dimanche, ordre d'affichage naturel

export default function ParametresAssiduite({
  joursReposPlanifiesInitial,
  jokersRestants,
}: {
  joursReposPlanifiesInitial: number[];
  jokersRestants: number;
}) {
  const router = useRouter();
  const t = useTranslations("assiduite");
  const [jours, setJours] = useState<number[]>(joursReposPlanifiesInitial);
  const [chargement, setChargement] = useState(false);

  async function basculer(jour: number) {
    const dejaChoisi = jours.includes(jour);
    if (!dejaChoisi && jours.length >= 2) return; // maximum 2, ignoré silencieusement au-delà
    const nouveauxJours = dejaChoisi ? jours.filter((j) => j !== jour) : [...jours, jour];
    setJours(nouveauxJours);
    setChargement(true);
    const res = await fetch("/api/profil/assiduite", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ joursReposPlanifies: nouveauxJours }),
    });
    setChargement(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <h2 className="font-semibold">{t("titre")}</h2>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {t("description")}
      </p>
      <div className="flex flex-wrap gap-2">
        {JOURS.map((jour) => (
          <button
            key={jour}
            type="button"
            disabled={chargement}
            onClick={() => basculer(jour)}
            className={`pill-toggle-btn ${jours.includes(jour) ? "active" : ""}`}
          >
            {t(`jour.${jour}`)}
          </button>
        ))}
      </div>
      <div className="border-t pt-3 text-xs" style={{ borderColor: "var(--border)", color: "var(--muted)" }}>
        {t("jokersRestants", { n: jokersRestants })}
      </div>
    </div>
  );
}
