import { getTranslations } from "next-intl/server";
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

  return (
    <section className="card glass flex flex-col gap-3 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
        {tTache("titre")}
      </p>
      <Mascotte categorie={categorie} message={message} />
      {beneficePerformance && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {beneficePerformance}
        </p>
      )}
    </section>
  );
}
