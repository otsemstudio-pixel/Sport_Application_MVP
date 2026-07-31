import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import NouvelObjectifForm from "@/components/NouvelObjectifForm";
import SupprimerObjectifBouton from "@/components/SupprimerObjectifBouton";
import { ArrowLeft, Check } from "lucide-react";

function progression(
  valeurActuelle: number | null,
  valeurCible: number,
  sensAmelioration: "PLUS_HAUT_MIEUX" | "PLUS_BAS_MIEUX"
) {
  if (valeurActuelle == null) return 0;
  if (sensAmelioration === "PLUS_BAS_MIEUX") {
    return Math.min(100, Math.round((valeurCible / valeurActuelle) * 100));
  }
  return Math.min(100, Math.round((valeurActuelle / valeurCible) * 100));
}

export default async function ObjectifsPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { sportPrincipal: true },
  });
  if (!athlete) redirect("/connexion");

  const t = await getTranslations("objectifs");
  const tEntrainement = await getTranslations("entrainement");

  const [objectifs, exercices] = await Promise.all([
    prisma.objectif.findMany({
      where: { athleteId: athlete.id },
      include: { exercice: true },
      orderBy: [{ atteint: "asc" }, { createdAt: "desc" }],
    }),
    prisma.exercice.findMany({
      where: {
        OR: [
          { categoriePerformance: athlete.sportPrincipal.categoriePerformance },
          { categoriePerformance: "RENFORCEMENT_GENERAL" },
        ],
      },
      orderBy: { nom: "asc" },
    }),
  ]);

  const records = await prisma.recordPersonnel.findMany({
    where: { athleteId: athlete.id, exerciceId: { in: objectifs.map((o) => o.exerciceId) } },
  });
  const recordParExercice = new Map(records.map((r) => [r.exerciceId, r.valeur]));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/entrainement" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourEntrainement")}
      </Link>
      <h1 className="text-2xl font-bold">{t("titre")}</h1>

      <NouvelObjectifForm exercices={exercices} />

      {objectifs.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t("aucunObjectif")}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {objectifs.map((o) => {
            const valeurActuelle = recordParExercice.get(o.exerciceId) ?? null;
            const pct = progression(valeurActuelle, o.valeurCible, o.exercice.sensAmelioration);
            const unite = tEntrainement(`unites.${o.exercice.uniteMesure}`);
            return (
              <div key={o.id} className="card flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link href={`/entrainement/exercices/${o.exerciceId}`} className="font-semibold underline-offset-2 hover:underline">
                      {o.exercice.nom}
                    </Link>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {t("cibleLabel", { valeur: o.valeurCible, unite })}
                      {valeurActuelle != null && ` · ${t("actuelLabel", { valeur: valeurActuelle, unite })}`}
                    </p>
                  </div>
                  {o.atteint ? (
                    <span className="chip chip-success shrink-0">
                      <Check size={12} />
                      {t("atteint")}
                    </span>
                  ) : (
                    <SupprimerObjectifBouton id={o.id} />
                  )}
                </div>
                <div className="progress-bar">
                  <div
                    className={`progress-bar-fill ${o.atteint ? "atteint" : ""}`}
                    style={{ width: `${o.atteint ? 100 : pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
