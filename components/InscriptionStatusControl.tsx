"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const STATUTS = ["EN_ATTENTE", "CONFIRME", "REFUSE"] as const;

export default function InscriptionStatusControl({
  evenementId,
  inscriptionId,
  statutInitial,
}: {
  evenementId: string;
  inscriptionId: string;
  statutInitial: string;
}) {
  const router = useRouter();
  const t = useTranslations("organisateur");
  const [chargement, setChargement] = useState(false);

  const LABELS: Record<(typeof STATUTS)[number], string> = {
    EN_ATTENTE: t("statutEnAttente"),
    CONFIRME: t("statutConfirme"),
    REFUSE: t("statutRefuse"),
  };

  async function handleChange(statut: string) {
    setChargement(true);
    await fetch(
      `/api/organisateur/evenements/${evenementId}/inscriptions/${inscriptionId}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut }),
      }
    );
    setChargement(false);
    router.refresh();
  }

  return (
    <select
      defaultValue={statutInitial}
      disabled={chargement}
      onChange={(e) => handleChange(e.target.value)}
      className="input !py-1.5 text-sm"
    >
      {STATUTS.map((s) => (
        <option key={s} value={s}>
          {LABELS[s]}
        </option>
      ))}
    </select>
  );
}
