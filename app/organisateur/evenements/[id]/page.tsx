import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import InscriptionStatusControl from "@/components/InscriptionStatusControl";
import ResultatsForm from "@/components/ResultatsForm";
import { ArrowLeft, Calendar, MapPin, Trophy, Users } from "lucide-react";

export default async function GestionEvenementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") redirect("/connexion");
  const { id } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      inscriptions: {
        include: { athlete: { select: { id: true, nom: true, ville: true } } },
        orderBy: { createdAt: "asc" },
      },
      resultats: true,
    },
  });

  if (!evenement || evenement.organisateurId !== session.organisateurId) {
    notFound();
  }

  const locale = await getLocale();
  const t = await getTranslations("organisateur");
  const resultatParAthlete = new Map(
    evenement.resultats.map((r) => [r.athleteId, r])
  );

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link
          href="/organisateur"
          className="mb-3 inline-flex items-center gap-1.5 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <ArrowLeft size={14} />
          {t("titreTableauDeBord")}
        </Link>
        <h1 className="text-2xl font-bold">{evenement.nom}</h1>
        <div
          className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm"
          style={{ color: "var(--muted)" }}
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={14} />
            {evenement.lieu}
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={14} />
            {new Date(evenement.date).toLocaleDateString(locale)}
          </span>
          <span className="flex items-center gap-1.5">
            <Users size={14} />
            {evenement.inscriptions.length}/{evenement.placesMax}
          </span>
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("inscriptionsTitre")}</h2>
        {evenement.inscriptions.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucuneInscriptionRecue")}
          </p>
        )}
        <div className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
          {evenement.inscriptions.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
              <div className="min-w-0">
                <div className="font-medium">{i.athlete.nom}</div>
                <div className="text-xs" style={{ color: "var(--muted)" }}>
                  {i.athlete.ville}
                </div>
              </div>
              <InscriptionStatusControl
                evenementId={evenement.id}
                inscriptionId={i.id}
                statutInitial={i.statut}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card flex flex-col gap-3 p-5">
        <h2 className="flex items-center gap-2 font-semibold">
          <Trophy size={17} style={{ color: "var(--gold)" }} />
          {t("resultatsTournoi")}
        </h2>
        <ResultatsForm
          evenementId={evenement.id}
          inscrits={evenement.inscriptions.map((i) => {
            const resultat = resultatParAthlete.get(i.athleteId);
            return {
              athleteId: i.athleteId,
              nom: i.athlete.nom,
              classement: resultat?.classement ?? null,
              score: resultat?.score ?? null,
            };
          })}
        />
      </section>
    </div>
  );
}
