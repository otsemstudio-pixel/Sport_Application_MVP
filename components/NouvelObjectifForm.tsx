"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Plus } from "lucide-react";

type Exercice = { id: string; nom: string };

export default function NouvelObjectifForm({ exercices }: { exercices: Exercice[] }) {
  const router = useRouter();
  const t = useTranslations("objectifs");
  const tCommun = useTranslations("commun");

  const [exerciceId, setExerciceId] = useState(exercices[0]?.id ?? "");
  const [valeurCible, setValeurCible] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    if (!exerciceId || !valeurCible) return;
    setErreur(null);
    setChargement(true);

    const res = await fetch("/api/objectifs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciceId,
        valeurCible: Number(valeurCible),
        dateLimite: dateLimite || undefined,
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    setValeurCible("");
    setDateLimite("");
    router.refresh();
  }

  return (
    <form onSubmit={creer} className="card flex flex-col gap-3 p-4">
      <h2 className="font-semibold">{t("nouvelObjectif")}</h2>
      <select value={exerciceId} onChange={(e) => setExerciceId(e.target.value)} className="input">
        {exercices.map((ex) => (
          <option key={ex.id} value={ex.id}>
            {ex.nom}
          </option>
        ))}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="any"
          placeholder={t("valeurCibleLabel")}
          value={valeurCible}
          onChange={(e) => setValeurCible(e.target.value)}
          className="input"
        />
        <input
          type="date"
          value={dateLimite}
          onChange={(e) => setDateLimite(e.target.value)}
          className="input"
          title={t("dateLimiteOptionnelle")}
        />
      </div>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      <button type="submit" disabled={chargement || !valeurCible} className="btn btn-primary self-start">
        <Plus size={15} />
        {t("creer")}
      </button>
    </form>
  );
}
