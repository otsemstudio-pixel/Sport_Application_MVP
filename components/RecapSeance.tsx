"use client";

import { useTranslations } from "next-intl";
import { Dumbbell } from "lucide-react";

type ExerciceRecap = {
  id: string;
  nom: string;
  uniteMesure: string;
  valeur: number;
  series: number | null;
};

export default function RecapSeance({ exercices }: { exercices: ExerciceRecap[] }) {
  const t = useTranslations("entrainement");
  const tFil = useTranslations("fil");
  if (exercices.length === 0) return null;

  return (
    <div
      className="flex flex-col gap-2 rounded-xl border p-3"
      style={{ borderColor: "var(--primary)", background: "var(--primary-soft)" }}
    >
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--primary)" }}>
        <Dumbbell size={14} />
        {tFil("seancePartageeTitre")}
      </div>
      <ul className="flex flex-col gap-1 text-sm">
        {exercices.map((e) => (
          <li key={e.id} className="flex items-center justify-between gap-2">
            <span className="font-medium">{e.nom}</span>
            <span style={{ color: "var(--muted)" }}>
              {e.series ? `${e.series}x${e.valeur}` : `${e.valeur} ${t(`unites.${e.uniteMesure}`)}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
