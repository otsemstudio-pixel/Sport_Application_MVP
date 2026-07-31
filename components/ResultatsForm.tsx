"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Save } from "lucide-react";

type Ligne = {
  athleteId: string;
  nom: string;
  classement: number | "";
  score: number | "";
};

export default function ResultatsForm({
  evenementId,
  inscrits,
}: {
  evenementId: string;
  inscrits: { athleteId: string; nom: string; classement: number | null; score: number | null }[];
}) {
  const router = useRouter();
  const [lignes, setLignes] = useState<Ligne[]>(
    inscrits.map((i) => ({
      athleteId: i.athleteId,
      nom: i.nom,
      classement: i.classement ?? "",
      score: i.score ?? "",
    }))
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);
  const [chargement, setChargement] = useState(false);

  function majLigne(athleteId: string, champ: "classement" | "score", valeur: string) {
    setLignes((prev) =>
      prev.map((l) =>
        l.athleteId === athleteId ? { ...l, [champ]: valeur === "" ? "" : Number(valeur) } : l
      )
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setSucces(false);

    const resultats = lignes
      .filter((l) => l.classement !== "" && l.score !== "")
      .map((l) => ({ athleteId: l.athleteId, classement: l.classement, score: l.score }));

    if (resultats.length === 0) {
      setErreur("Renseigne au moins un classement et un score.");
      return;
    }

    setChargement(true);
    const res = await fetch(`/api/organisateur/evenements/${evenementId}/resultats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resultats }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    setSucces(true);
    router.refresh();
  }

  if (inscrits.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        Aucun inscrit pour l&apos;instant.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
        {lignes.map((l) => (
          <div key={l.athleteId} className="flex items-center gap-2 py-2 text-sm">
            <span className="flex-1 truncate font-medium">{l.nom}</span>
            <input
              type="number"
              placeholder="Classement"
              value={l.classement}
              onChange={(e) => majLigne(l.athleteId, "classement", e.target.value)}
              className="input w-24 !py-1.5"
            />
            <input
              type="number"
              step="any"
              placeholder="Score"
              value={l.score}
              onChange={(e) => majLigne(l.athleteId, "score", e.target.value)}
              className="input w-24 !py-1.5"
            />
          </div>
        ))}
      </div>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      {succes && (
        <p className="chip chip-success self-start">
          <CheckCircle2 size={14} />
          Résultats enregistrés.
        </p>
      )}
      <button type="submit" disabled={chargement} className="btn btn-primary self-start">
        <Save size={16} />
        {chargement ? "Enregistrement…" : "Enregistrer les résultats"}
      </button>
    </form>
  );
}
