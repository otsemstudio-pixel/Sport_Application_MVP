"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Clock, UserPlus, XCircle } from "lucide-react";

const STATUTS: Record<
  string,
  { label: string; icon: typeof CheckCircle2; chip: string }
> = {
  EN_ATTENTE: { label: "Inscription en attente", icon: Clock, chip: "chip-neutral" },
  CONFIRME: { label: "Inscription confirmée", icon: CheckCircle2, chip: "chip-success" },
  REFUSE: { label: "Inscription refusée", icon: XCircle, chip: "chip-danger" },
};

export default function InscriptionButton({
  evenementId,
  complet,
  bloque,
  statutInscription,
}: {
  evenementId: string;
  complet: boolean;
  bloque: boolean;
  statutInscription?: string;
}) {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  if (statutInscription) {
    const statut = STATUTS[statutInscription] ?? STATUTS.EN_ATTENTE;
    const Icon = statut.icon;
    return (
      <span className={`chip self-start ${statut.chip}`}>
        <Icon size={14} />
        {statut.label}
      </span>
    );
  }

  async function handleClick() {
    setErreur(null);
    setChargement(true);
    const res = await fetch(`/api/evenements/${evenementId}/inscription`, {
      method: "POST",
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleClick}
        disabled={complet || bloque || chargement}
        className="btn btn-primary self-start"
      >
        <UserPlus size={16} />
        {chargement ? "Inscription…" : "S'inscrire"}
      </button>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
    </div>
  );
}
