"use client";

import { useEffect, useState } from "react";

type Sport = {
  id: string;
  nom: string;
  categoriePerformance: "EXPLOSIVITE_PUISSANCE" | "ENDURANCE" | "COLLECTIF_TACTIQUE" | "COMBAT";
};

const LABELS_CATEGORIE: Record<Sport["categoriePerformance"], string> = {
  EXPLOSIVITE_PUISSANCE: "Explosivité & puissance",
  ENDURANCE: "Endurance",
  COLLECTIF_TACTIQUE: "Collectif & tactique",
  COMBAT: "Combat",
};

export default function SportSelect({
  name,
  required,
  defaultValue,
  className = "input",
  avecTousLesSports = false,
}: {
  name: string;
  required?: boolean;
  defaultValue?: string;
  className?: string;
  avecTousLesSports?: boolean;
}) {
  const [sports, setSports] = useState<Sport[] | null>(null);

  useEffect(() => {
    fetch("/api/sports")
      .then((res) => res.json())
      .then(setSports)
      .catch(() => setSports([]));
  }, []);

  if (!sports) {
    return (
      <select disabled className={className}>
        <option>Chargement…</option>
      </select>
    );
  }

  const groupes = new Map<Sport["categoriePerformance"], Sport[]>();
  for (const sport of sports) {
    const liste = groupes.get(sport.categoriePerformance) ?? [];
    liste.push(sport);
    groupes.set(sport.categoriePerformance, liste);
  }

  return (
    <select name={name} required={required} defaultValue={defaultValue} className={className}>
      {avecTousLesSports ? (
        <option value="">Tous les sports</option>
      ) : (
        <option value="" disabled>
          Choisir un sport…
        </option>
      )}
      {Array.from(groupes.entries()).map(([categorie, liste]) => (
        <optgroup key={categorie} label={LABELS_CATEGORIE[categorie]}>
          {liste.map((sport) => (
            <option key={sport.id} value={sport.id}>
              {sport.nom}
            </option>
          ))}
        </optgroup>
      ))}
    </select>
  );
}
