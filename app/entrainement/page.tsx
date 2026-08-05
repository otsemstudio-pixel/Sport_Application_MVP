import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import SeanceEntrainementForm from "@/components/SeanceEntrainementForm";
import StatistiquesEntrainement from "@/components/StatistiquesEntrainement";
import CalendrierRegularite from "@/components/CalendrierRegularite";
import TacheDuJour from "@/components/TacheDuJour";
import ProgressRing from "@/components/ProgressRing";
import FondSport from "@/components/FondSport";
import ProgressionJournaliere from "@/components/ProgressionJournaliere";
import SerieAssiduite from "@/components/SerieAssiduite";
import LigueHebdomadaire from "@/components/LigueHebdomadaire";
import ResumeHebdomadaire from "@/components/ResumeHebdomadaire";
import { resoudreFondEcran } from "@/lib/sportBackgrounds";
import { activiteParJour } from "@/lib/activite";
import type { EvenementMascotte } from "@/lib/mascotte";
import { determinerSeanceDuJourProgramme, determinerTacheDuJour } from "@/lib/tacheDuJour";
import { calculerAssiduite } from "@/lib/assiduite";
import { cleSemaineISO } from "@/lib/ligues";
import { CalendarRange, Lock, Medal, Target, Trophy } from "lucide-react";

const TROIS_JOURS_MS = 3 * 86_400_000;
const QUATORZE_JOURS_MS = 14 * 86_400_000;

export default async function EntrainementPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { sportPrincipal: true },
  });
  if (!athlete) redirect("/connexion");

  const t = await getTranslations("entrainement");

  const [
    exercices,
    badges,
    groupes,
    totalSeances,
    records,
    programmeSuivi,
    seancesRecentes,
    seanceDuJourProgramme,
    assiduite,
  ] = await Promise.all([
      prisma.exercice.findMany({
        where: {
          OR: [
            { categoriePerformance: athlete.sportPrincipal.categoriePerformance },
            { categoriePerformance: "RENFORCEMENT_GENERAL" },
          ],
        },
        orderBy: { nom: "asc" },
      }),
      prisma.badge.findMany({ orderBy: { seuilSeances: "asc" } }),
      prisma.seanceEntrainement.groupBy({
        by: ["athleteId"],
        where: { athlete: { ville: athlete.ville, sportPrincipalId: athlete.sportPrincipalId } },
        _count: { _all: true },
        orderBy: { _count: { athleteId: "desc" } },
        take: 20,
      }),
      prisma.seanceEntrainement.count({ where: { athleteId: athlete.id } }),
      prisma.recordPersonnel.findMany({ where: { athleteId: athlete.id } }),
      prisma.athleteProgramme.findFirst({
        where: { athleteId: athlete.id, statut: "EN_COURS" },
        include: { programme: true },
        orderBy: { dateDebut: "desc" },
      }),
      prisma.seanceEntrainement.findMany({
        where: { athleteId: athlete.id, date: { gte: new Date(Date.now() - QUATORZE_JOURS_MS) } },
        select: { date: true },
      }),
      determinerSeanceDuJourProgramme(athlete.id),
      calculerAssiduite(athlete.id),
    ]);

  // Régularité de la semaine : nombre de jours distincts (sur les 7 derniers)
  // ayant au moins une séance, affiché comme anneau de progression. Réutilise
  // le même jeu de séances (14 jours) que le graphique de progression
  // journalière ci-dessous plutôt qu'une requête séparée.
  const donneesProgressionJournaliere = activiteParJour(seancesRecentes, 14);
  const joursActifsSemaine = donneesProgressionJournaliere.slice(-7).filter((p) => p.nombreSeances > 0).length;
  const pourcentageRegularite = Math.round((joursActifsSemaine / 7) * 100);

  // Un programme peut être suivi sans restriction de catégorie : ses
  // exercices ne sont donc pas garantis d'être dans la liste filtrée par la
  // catégorie de l'athlète. Sans ça, le <select> du formulaire pointerait
  // vers un exercice absent de ses options et "Ajouter la série" resterait
  // silencieusement sans effet.
  const exercicesPourFormulaire = seanceDuJourProgramme
    ? [
        ...exercices,
        ...seanceDuJourProgramme.exercicesPrevus
          .map((p) => p.exercice)
          .filter((e) => !exercices.some((ex) => ex.id === e.id)),
      ]
    : exercices;

  const tacheDuJour = await determinerTacheDuJour(
    athlete.id,
    athlete.sportPrincipal.categoriePerformance,
    seanceDuJourProgramme
  );

  let evenementMascotte: EvenementMascotte = "TACHE_DUJOUR";
  let suggererReductionCharge = false;
  if (tacheDuJour) {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const [seanceAujourdhui, derniereSeance] = await Promise.all([
      prisma.seanceEntrainement.findFirst({
        where: { athleteId: athlete.id, date: { gte: debutJour } },
        include: { exercicesRealises: true },
      }),
      prisma.seanceEntrainement.findFirst({
        where: { athleteId: athlete.id },
        orderBy: { date: "desc" },
        select: { date: true },
      }),
    ]);

    const tacheCompleteeAujourdhui = seanceAujourdhui?.exercicesRealises.some(
      (er) => er.exerciceId === tacheDuJour!.exerciceId
    );
    const inactif3Jours = !derniereSeance || Date.now() - derniereSeance.date.getTime() >= TROIS_JOURS_MS;

    if (tacheCompleteeAujourdhui) evenementMascotte = "TACHE_COMPLETEE";
    else if (inactif3Jours) evenementMascotte = "INACTIVITE_3J";

    if (tacheDuJour.exerciceId) {
      const dernieresSeancesAvecExercice = await prisma.seanceEntrainement.findMany({
        where: { athleteId: athlete.id, exercicesRealises: { some: { exerciceId: tacheDuJour.exerciceId } } },
        orderBy: { date: "desc" },
        take: 3,
        include: { retourSeance: true },
      });
      suggererReductionCharge =
        dernieresSeancesAvecExercice.length === 3 &&
        dernieresSeancesAvecExercice.every((s) => s.retourSeance?.ressenti === "DIFFICILE");
    }
  }

  const badgesObtenus = await prisma.athleteBadge.findMany({
    where: { athleteId: athlete.id },
    select: { badgeId: true },
  });
  const idsObtenus = new Set(badgesObtenus.map((b) => b.badgeId));

  const athletesClassement = await prisma.athlete.findMany({
    where: { id: { in: groupes.map((g) => g.athleteId) } },
    select: { id: true, nom: true },
  });
  const nomParId = new Map(athletesClassement.map((a) => [a.id, a.nom]));
  const classement = groupes.map((g, index) => ({
    rang: index + 1,
    nom: nomParId.get(g.athleteId) ?? t("athleteFallback"),
    nombreSeances: g._count._all,
    moi: g.athleteId === athlete.id,
  }));
  const monRang = classement.find((c) => c.moi)?.rang ?? null;

  const fondSportUrl = athlete.afficherFondSport ? resoudreFondEcran(athlete) : null;

  return (
    <div className="flex flex-col gap-8">
      {fondSportUrl && <FondSport imageUrl={fondSportUrl} nettete={athlete.netteteFondSport} />}
      <div>
        <h1 className="text-2xl font-bold">{t("titre")}</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {athlete.sportPrincipal.nom} · {athlete.ville}
        </p>
      </div>

      {tacheDuJour && (
        <TacheDuJour
          categorie={athlete.sportPrincipal.categoriePerformance}
          titre={tacheDuJour.titre}
          beneficePerformance={tacheDuJour.beneficePerformance}
          evenement={evenementMascotte}
          suggererReductionCharge={suggererReductionCharge}
        />
      )}

      <ResumeHebdomadaire categorie={athlete.sportPrincipal.categoriePerformance} />

      <section className="hero-card flex items-center gap-4 p-5">
        <ProgressRing pourcentage={pourcentageRegularite} taille={84} epaisseur={8}>
          <span className="text-lg font-bold">{pourcentageRegularite}%</span>
        </ProgressRing>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
            {t("regulariteTitre")}
          </p>
          <p className="text-sm font-semibold">{t("regulariteJours", { n: joursActifsSemaine })}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {t("regulariteDescription")}
          </p>
        </div>
      </section>

      <div className="flex flex-col gap-2">
        <section className="grid grid-cols-3 gap-3">
          <SerieAssiduite
            serieActuelle={assiduite.serieActuelle}
            recordSerie={assiduite.recordSerie}
            label={t("statSerie")}
            labelRecord={t("statSerieRecord", { n: assiduite.recordSerie })}
          />
          <StatCard icon={Medal} valeur={idsObtenus.size} label={t("statBadges")} />
          <StatCard icon={Trophy} valeur={monRang ? `#${monRang}` : "—"} label={t("statRangLocal")} />
        </section>
        <p className="text-center text-xs" style={{ color: "var(--muted)" }}>
          {t("statSeancesTotal", { n: totalSeances })}
        </p>
      </div>

      <ProgressionJournaliere donnees={donneesProgressionJournaliere} />

      <CalendrierRegularite />

      <section className="grid grid-cols-2 gap-3">
        <Link href="/entrainement/programmes" className="card surface-hover flex flex-col items-center gap-1.5 p-4 text-center">
          <CalendarRange size={18} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-semibold">{t("decouvrirProgrammes")}</span>
        </Link>
        <Link href="/entrainement/objectifs" className="card surface-hover flex flex-col items-center gap-1.5 p-4 text-center">
          <Target size={18} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-semibold">{t("mesObjectifs")}</span>
        </Link>
      </section>

      {programmeSuivi && (
        <section className="card flex items-center justify-between gap-3 p-4" style={{ borderColor: "var(--primary)" }}>
          <div>
            <p className="text-xs" style={{ color: "var(--muted)" }}>
              {t("programmeEnCours")}
            </p>
            <p className="font-semibold">{programmeSuivi.programme.nom}</p>
          </div>
          <Link href={`/entrainement/programmes/${programmeSuivi.programmeId}`} className="btn btn-secondary">
            {t("voirMonProgramme")}
          </Link>
        </section>
      )}

      <section id="enregistrer-seance" className="card flex flex-col gap-4 p-5 scroll-mt-20">
        <h2 className="font-semibold">{t("enregistrerSeance")}</h2>
        <SeanceEntrainementForm exercices={exercicesPourFormulaire} records={records} seanceDuJourProgramme={seanceDuJourProgramme} />
      </section>

      <StatistiquesEntrainement />

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("badges")}</h2>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const obtenu = idsObtenus.has(badge.id);
            return (
              <div
                key={badge.id}
                className="stat-card-rich flex flex-col items-center gap-2 p-3.5 text-center"
                style={
                  obtenu
                    ? { borderColor: "var(--gold)", background: "var(--gold-soft)", boxShadow: "0 6px 18px -10px var(--gold-soft)" }
                    : { opacity: 0.55 }
                }
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-full"
                  style={{
                    background: obtenu ? "var(--gold-soft)" : "var(--surface-hover)",
                    color: obtenu ? "var(--gold)" : "var(--muted)",
                  }}
                >
                  {obtenu ? <Medal size={20} /> : <Lock size={17} />}
                </div>
                <div className="text-xs font-semibold">{badge.nom}</div>
                <div className="text-[11px] leading-tight" style={{ color: "var(--muted)" }}>
                  {badge.description}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <LigueHebdomadaire />

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("classementLocal", { ville: athlete.ville })}</h2>
        {classement.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucuneSeance")}
          </p>
        ) : (
          <ol className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
            {classement.map((c) => (
              <li
                key={c.rang}
                className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm"
                style={c.moi ? { background: "var(--primary-soft)" } : undefined}
              >
                <div className="flex items-center gap-3">
                  <RangBadge rang={c.rang} />
                  <span className={c.moi ? "font-semibold" : ""}>
                    {c.nom} {c.moi && <span style={{ color: "var(--primary)" }}>{t("toi")}</span>}
                  </span>
                </div>
                <span style={{ color: "var(--muted)" }}>
                  {t("nombreSeances", { n: c.nombreSeances })}
                </span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  valeur,
  label,
}: {
  icon: React.ComponentType<{ size?: number }>;
  valeur: string | number;
  label: string;
}) {
  return (
    <div className="stat-card-rich flex flex-col items-center gap-2 py-5">
      <div className="badge-icon-circle h-10 w-10">
        <Icon size={18} />
      </div>
      <span className="text-xl font-bold">{valeur}</span>
      <span className="text-[11px]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}

const MEDAILLES = ["var(--gold)", "#b8bfc7", "#c17a4c"];

function RangBadge({ rang }: { rang: number }) {
  if (rang <= 3) {
    return (
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white"
        style={{ background: MEDAILLES[rang - 1] }}
      >
        {rang}
      </span>
    );
  }
  return (
    <span
      className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold"
      style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
    >
      {rang}
    </span>
  );
}
