"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, PartyPopper, PlusCircle } from "lucide-react";

type Defi = {
  id: string;
  nom: string;
  description: string;
  unite: string;
};

export default function SeanceForm({ defis }: { defis: Defi[] }) {
  const router = useRouter();
  const t = useTranslations("entrainement");
  const tCommun = useTranslations("commun");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setSucces(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/seances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        defiId: form.get("defiId"),
        valeurMesuree: Number(form.get("valeurMesuree")),
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }

    const data = await res.json();
    if (data.nouveauxBadges?.length > 0) {
      setSucces(
        t("seanceEnregistreeAvecBadges", {
          badges: data.nouveauxBadges.map((b: { nom: string }) => b.nom).join(", "),
        })
      );
    } else {
      setSucces(t("seanceEnregistree"));
    }
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  if (defis.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--muted)" }}>
        {t("aucunDefi")}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="field-label">
        {t("defi")}
        <select name="defiId" required className="input">
          {defis.map((defi) => (
            <option key={defi.id} value={defi.id}>
              {defi.nom} ({defi.unite})
            </option>
          ))}
        </select>
      </label>
      <label className="field-label">
        {t("valeurMesuree")}
        <input name="valeurMesuree" type="number" step="any" required className="input" />
      </label>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      {succes && (
        <p className="chip chip-success self-start">
          <PartyPopper size={14} />
          {succes}
        </p>
      )}
      <button type="submit" disabled={chargement} className="btn btn-primary">
        <PlusCircle size={16} />
        {chargement ? t("enregistrementEnCours") : t("enregistrerLaSeance")}
      </button>
    </form>
  );
}
