"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";

export default function SupprimerObjectifBouton({ id }: { id: string }) {
  const router = useRouter();
  const t = useTranslations("objectifs");
  const [chargement, setChargement] = useState(false);

  async function supprimer() {
    setChargement(true);
    await fetch(`/api/objectifs/${id}`, { method: "DELETE" });
    setChargement(false);
    router.refresh();
  }

  return (
    <button onClick={supprimer} disabled={chargement} className="btn btn-ghost !p-1.5" aria-label={t("supprimer")}>
      <Trash2 size={14} />
    </button>
  );
}
