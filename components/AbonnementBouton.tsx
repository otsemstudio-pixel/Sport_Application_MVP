"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { UserCheck, UserPlus } from "lucide-react";

export default function AbonnementBouton({
  type,
  id,
  abonneInitial,
}: {
  type: "athlete" | "organisateur";
  id: string;
  abonneInitial: boolean;
}) {
  const t = useTranslations("profilPublic");
  const [abonne, setAbonne] = useState(abonneInitial);
  const [chargement, setChargement] = useState(false);

  async function basculer() {
    const prochainEtat = !abonne;
    setAbonne(prochainEtat);
    setChargement(true);
    const res = await fetch(`/api/abonnements/${type}/${id}`, { method: "POST" });
    setChargement(false);
    if (!res.ok) {
      setAbonne(!prochainEtat);
    }
  }

  return (
    <button onClick={basculer} disabled={chargement} className={abonne ? "btn btn-secondary" : "btn btn-primary"}>
      {abonne ? <UserCheck size={15} /> : <UserPlus size={15} />}
      {abonne ? t("seDesabonner") : t("sabonner")}
    </button>
  );
}
