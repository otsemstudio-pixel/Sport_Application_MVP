"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock, UserPlus, XCircle } from "lucide-react";

const ICONES: Record<string, typeof CheckCircle2> = {
  EN_ATTENTE: Clock,
  CONFIRME: CheckCircle2,
  REFUSE: XCircle,
};
const CHIPS: Record<string, string> = {
  EN_ATTENTE: "chip-neutral",
  CONFIRME: "chip-success",
  REFUSE: "chip-danger",
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
  const t = useTranslations("evenement");
  const tCommun = useTranslations("commun");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  if (statutInscription) {
    const cle = STATUT_LABEL_KEY[statutInscription] ?? "inscriptionEnAttente";
    const Icon = ICONES[statutInscription] ?? Clock;
    return (
      <span className={`chip self-start ${CHIPS[statutInscription] ?? "chip-neutral"}`}>
        <Icon size={14} />
        {t(cle)}
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
      setErreur(data.error ?? tCommun("erreurGenerique"));
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
        {chargement ? t("inscriptionEnCours") : t("sinscrire")}
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

const STATUT_LABEL_KEY: Record<string, "inscriptionEnAttente" | "inscriptionConfirmee" | "inscriptionRefusee"> = {
  EN_ATTENTE: "inscriptionEnAttente",
  CONFIRME: "inscriptionConfirmee",
  REFUSE: "inscriptionRefusee",
};
