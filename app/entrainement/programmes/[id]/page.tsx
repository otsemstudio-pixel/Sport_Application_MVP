import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import SuivreProgrammeBouton from "@/components/SuivreProgrammeBouton";
import { ArrowLeft, Check, Circle } from "lucide-react";

export default async function ProgrammeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");
  const { id } = await params;

  const t = await getTranslations("programmes");
  const tEntrainement = await getTranslations("entrainement");

  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      seances: {
        orderBy: [{ numeroSemaine: "asc" }, { numeroJour: "asc" }],
        include: { exercicesPrevus: { include: { exercice: true } } },
      },
    },
  });
  if (!programme) notFound();

  const suivi = await prisma.athleteProgramme.findFirst({
    where: { athleteId: session.athleteId, programmeId: id },
    orderBy: { dateDebut: "desc" },
  });

  const idsProgrammeSeance = programme.seances.map((s) => s.id);
  const seancesRealisees =
    suivi && idsProgrammeSeance.length > 0
      ? await prisma.seanceEntrainement.findMany({
          where: { athleteId: session.athleteId, programmeSeanceId: { in: idsProgrammeSeance } },
          select: { programmeSeanceId: true },
        })
      : [];
  const idsFaits = new Set(seancesRealisees.map((s) => s.programmeSeanceId));

  const semaines = new Map<number, typeof programme.seances>();
  for (const s of programme.seances) {
    if (!semaines.has(s.numeroSemaine)) semaines.set(s.numeroSemaine, []);
    semaines.get(s.numeroSemaine)!.push(s);
  }

  function libelleCible(ep: NonNullable<typeof programme>["seances"][number]["exercicesPrevus"][number]) {
    const valeur = ep.repetitionsPrevues ?? ep.dureePrevueSecondes ?? ep.distancePrevueMetres;
    if (valeur == null) return ep.exercice.nom;
    const unite = tEntrainement(`unites.${ep.exercice.uniteMesure}`);
    const series = ep.seriesPrevues ? `${ep.seriesPrevues} x ` : "";
    return `${ep.exercice.nom} : ${series}${valeur} ${unite}`;
  }

  return (
    <div className="flex flex-col gap-6">
      <Link href="/entrainement/programmes" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourProgrammes")}
      </Link>

      <div className="flex flex-col gap-3">
        <div>
          <h1 className="text-2xl font-bold">{programme.nom}</h1>
          <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
            {programme.description}
          </p>
        </div>
        <SuivreProgrammeBouton
          programmeId={programme.id}
          athleteProgrammeId={suivi?.statut === "EN_COURS" ? suivi.id : undefined}
          enCours={suivi?.statut === "EN_COURS"}
        />
      </div>

      {[...semaines.entries()].map(([numeroSemaine, seances]) => (
        <section key={numeroSemaine} className="flex flex-col gap-2">
          <h2 className="font-semibold">{t("semaineNumero", { n: numeroSemaine })}</h2>
          <div className="card flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {seances.map((s) => {
              const fait = idsFaits.has(s.id);
              return (
                <div key={s.id} className="flex items-start gap-3 p-4">
                  {fait ? (
                    <Check size={16} className="mt-0.5 shrink-0" style={{ color: "var(--success)" }} />
                  ) : (
                    <Circle size={16} className="mt-0.5 shrink-0" style={{ color: "var(--muted)" }} />
                  )}
                  <div>
                    <p className="text-sm font-medium">
                      {t("jourNumero", { n: s.numeroJour })} · {s.nomSeance}
                    </p>
                    <ul className="mt-1 flex flex-col gap-0.5 text-xs" style={{ color: "var(--muted)" }}>
                      {s.exercicesPrevus.map((ep) => (
                        <li key={ep.id}>{libelleCible(ep)}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
