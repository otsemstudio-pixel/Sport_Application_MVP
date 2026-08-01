import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import Mascotte from "@/components/Mascotte";
import { CLES_MESSAGE_MASCOTTE, type EvenementMascotte } from "@/lib/mascotte";

type CategoriePerformance =
  | "EXPLOSIVITE_PUISSANCE"
  | "ENDURANCE"
  | "COLLECTIF_TACTIQUE"
  | "COMBAT"
  | "RENFORCEMENT_GENERAL";

export default async function TacheDuJour({
  categorie,
  titre,
  beneficePerformance,
  evenement,
  suggererReductionCharge,
}: {
  categorie: CategoriePerformance;
  titre: string;
  beneficePerformance: string | null;
  evenement: EvenementMascotte;
  suggererReductionCharge: boolean;
}) {
  const t = await getTranslations("mascotte");
  const tTache = await getTranslations("tacheDuJour");

  let message = t(CLES_MESSAGE_MASCOTTE[evenement], { titre });
  if (suggererReductionCharge) {
    message = `${message} ${t("suggestionReductionCharge")}`;
  }

  const badge =
    evenement === "TACHE_COMPLETEE"
      ? { label: tTache("badgeTermine"), classe: "chip-success" }
      : evenement === "INACTIVITE_3J"
        ? { label: tTache("badgeReprise"), classe: "chip-primary" }
        : { label: tTache("badgeAujourdhui"), classe: "chip-primary" };

  return (
    <section className="card glass flex flex-col gap-3 p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
          {tTache("titre")}
        </p>
        <span className={`chip ${badge.classe}`}>{badge.label}</span>
      </div>

      <p className="text-lg font-bold">{titre}</p>

      <Mascotte categorie={categorie} message={message} />

      {beneficePerformance && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {beneficePerformance}
        </p>
      )}

      <a href="#enregistrer-seance" className="btn btn-primary self-start">
        <Sparkles size={15} />
        {tTache("commencer")}
      </a>
    </section>
  );
}
