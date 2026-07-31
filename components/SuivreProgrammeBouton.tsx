"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function SuivreProgrammeBouton({
  programmeId,
  athleteProgrammeId,
  enCours,
}: {
  programmeId: string;
  athleteProgrammeId?: string;
  enCours: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("programmes");
  const [chargement, setChargement] = useState(false);

  async function suivre() {
    setChargement(true);
    await fetch("/api/athlete-programmes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ programmeId }),
    });
    setChargement(false);
    router.refresh();
  }

  async function quitter() {
    if (!athleteProgrammeId) return;
    setChargement(true);
    await fetch(`/api/athlete-programmes/${athleteProgrammeId}`, { method: "PATCH" });
    setChargement(false);
    router.refresh();
  }

  if (enCours) {
    return (
      <button onClick={quitter} disabled={chargement} className="btn btn-secondary">
        {t("quitterCeProgramme")}
      </button>
    );
  }

  return (
    <button onClick={suivre} disabled={chargement} className="btn btn-primary">
      {t("suivreCeProgramme")}
    </button>
  );
}
