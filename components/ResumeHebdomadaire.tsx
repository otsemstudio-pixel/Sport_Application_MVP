"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import Mascotte from "@/components/Mascotte";
import { CLES_MESSAGE_MASCOTTE } from "@/lib/mascotte";

type CategoriePerformance =
  | "EXPLOSIVITE_PUISSANCE"
  | "ENDURANCE"
  | "COLLECTIF_TACTIQUE"
  | "COMBAT"
  | "RENFORCEMENT_GENERAL";

type Resume = {
  nouveau: boolean;
  nombreSeances: number;
  xpGagne: number;
  nouveauxRecords: number;
  ligue: { xpSemaine: number; niveau: number } | null;
};

export default function ResumeHebdomadaire({ categorie }: { categorie: CategoriePerformance }) {
  const t = useTranslations("mascotte");
  const tResume = useTranslations("resumeHebdomadaire");
  const [resume, setResume] = useState<Resume | null>(null);
  const [ferme, setFerme] = useState(false);

  useEffect(() => {
    fetch("/api/resume-hebdomadaire")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.nouveau && setResume(data))
      .catch(() => {});
  }, []);

  if (!resume || ferme) return null;

  async function fermer() {
    setFerme(true);
    await fetch("/api/resume-hebdomadaire/vu", { method: "POST" }).catch(() => {});
  }

  return (
    <section className="card glass flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          {tResume("titre")}
        </p>
        <button onClick={fermer} className="text-sm" style={{ color: "var(--muted)" }} aria-label={tResume("fermer")}>
          <X size={16} />
        </button>
      </div>

      <Mascotte categorie={categorie} message={t(CLES_MESSAGE_MASCOTTE.RESUME_HEBDO)}>
        <ul className="mt-2 flex flex-col gap-1 text-sm">
          <li>{tResume("nombreSeances", { n: resume.nombreSeances })}</li>
          <li>{tResume("xpGagne", { n: resume.xpGagne })}</li>
          {resume.nouveauxRecords > 0 && <li>{tResume("nouveauxRecords", { n: resume.nouveauxRecords })}</li>}
          {resume.ligue && <li>{tResume("positionLigue", { xp: resume.ligue.xpSemaine })}</li>}
        </ul>
      </Mascotte>
    </section>
  );
}
