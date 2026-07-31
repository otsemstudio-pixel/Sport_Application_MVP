import { redirect } from "next/navigation";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import InscriptionButton from "@/components/InscriptionButton";
import SportSelect from "@/components/SportSelect";
import { Calendar, GraduationCap, MapPin, Search, ShieldAlert, Users } from "lucide-react";

export default async function TournoisPage({
  searchParams,
}: {
  searchParams: Promise<{ ville?: string; sportId?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const { ville, sportId } = await searchParams;

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true, inscriptions: true },
  });
  if (!athlete) redirect("/connexion");

  const mineurNonConsenti = estBloquePourConsentement(athlete);
  const inscriptionsParEvenement = new Map(
    athlete.inscriptions.map((i) => [i.evenementId, i.statut])
  );

  const evenements = await prisma.evenement.findMany({
    where: {
      lieu: ville ? { contains: ville } : undefined,
      sportId: sportId ? { equals: sportId } : undefined,
    },
    include: {
      sport: { select: { nom: true } },
      organisateur: { select: { nom: true } },
      _count: { select: { inscriptions: true } },
    },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Tournois</h1>

      <form className="card flex flex-col gap-2 p-3 sm:flex-row" method="get">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--muted)" }}
          />
          <input
            name="ville"
            placeholder="Filtrer par ville"
            defaultValue={ville ?? ""}
            className="input w-full pl-9"
          />
        </div>
        <SportSelect
          name="sportId"
          defaultValue={sportId ?? ""}
          avecTousLesSports
          className="input sm:w-44"
        />
        <button type="submit" className="btn btn-primary">
          Filtrer
        </button>
      </form>

      {mineurNonConsenti && (
        <p
          className="card flex items-center gap-2 p-3 text-sm"
          style={{ borderColor: "var(--gold)", background: "var(--gold-soft)" }}
        >
          <ShieldAlert size={16} style={{ color: "var(--gold)" }} className="shrink-0" />
          Ton profil est mineur et en attente de consentement parental : tu ne
          peux pas encore t&apos;inscrire à un tournoi.{" "}
          <a href="/profil" className="font-medium underline">
            Valider le consentement
          </a>
        </p>
      )}

      <div className="flex flex-col gap-3">
        {evenements.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Aucun événement ne correspond à ces filtres.
          </p>
        )}
        {evenements.map((e) => {
          const placesRestantes = e.placesMax - e._count.inscriptions;
          const statutInscription = inscriptionsParEvenement.get(e.id);
          const complet = placesRestantes <= 0;
          const progression = Math.min(
            100,
            Math.round((e._count.inscriptions / e.placesMax) * 100)
          );
          const ouvertDebutants = e.niveauRequis === "DEBUTANT" || e.niveauRequis === "TOUS_NIVEAUX";
          return (
            <div key={e.id} className="card flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{e.nom}</h3>
                  <p className="mt-0.5 text-xs" style={{ color: "var(--muted)" }}>
                    {e.sport.nom} · Organisé par {e.organisateur.nom}
                  </p>
                </div>
                <span className={`chip shrink-0 ${complet ? "chip-danger" : "chip-primary"}`}>
                  {complet ? "Complet" : `${placesRestantes} places`}
                </span>
              </div>

              {(ouvertDebutants || !e.clubRequis) && (
                <div className="flex flex-wrap gap-1.5">
                  {ouvertDebutants && (
                    <span className="chip chip-success">
                      <GraduationCap size={12} />
                      Ouvert aux débutants
                    </span>
                  )}
                  {!e.clubRequis && <span className="chip chip-success">Sans club requis</span>}
                </div>
              )}

              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {e.description}
              </p>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: "var(--muted)" }}>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} />
                  {e.lieu}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  {new Date(e.date).toLocaleDateString("fr-FR")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Users size={14} />
                  {e._count.inscriptions}/{e.placesMax} inscrits
                </span>
                {e.fraisInscription > 0 && <span>{e.fraisInscription} FCFA</span>}
              </div>

              <div
                className="h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: "var(--surface-hover)" }}
              >
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${progression}%`,
                    background: complet ? "var(--danger)" : "var(--primary)",
                  }}
                />
              </div>

              <InscriptionButton
                evenementId={e.id}
                complet={complet}
                bloque={mineurNonConsenti}
                statutInscription={statutInscription}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
