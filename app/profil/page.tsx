import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, isMineur } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import ConsentementFlow from "@/components/ConsentementFlow";
import BasculeMensurations from "@/components/BasculeMensurations";
import BandeauStatistiquesProfil from "@/components/BandeauStatistiquesProfil";
import ParametresApparence from "@/components/ParametresApparence";
import ParametresNomUtilisateur from "@/components/ParametresNomUtilisateur";
import ParametresAssiduite from "@/components/ParametresAssiduite";
import ParametresNotifications from "@/components/ParametresNotifications";
import ResumeActiviteProfil from "@/components/ResumeActiviteProfil";
import Avatar from "@/components/Avatar";
import { activiteParJour, activiteParSemaine } from "@/lib/activite";
import { fondSportPour } from "@/lib/sportBackgrounds";
import { calculerAssiduite } from "@/lib/assiduite";
import { AtSign, Calendar, MapPin, Mail, ShieldCheck, ShieldAlert, Activity, Scale } from "lucide-react";

export default async function ProfilPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true, sportPrincipal: true },
  });
  if (!athlete) redirect("/connexion");

  const assiduite = await calculerAssiduite(athlete.id);

  const locale = await getLocale();
  const t = await getTranslations("auth");
  const tConsentement = await getTranslations("consentement");
  const tMensurations = await getTranslations("mensurations");
  const tMentions = await getTranslations("mentions");
  const mineur = isMineur(athlete.dateNaissance);
  const consentementValide = athlete.consentement?.codeValide === true;
  const bannerUrl = athlete.bannerUrl ?? fondSportPour(athlete.sportPrincipal.nom);

  const [abonnes, abonnements, likes, commentaires, vues, seancesRecentes] = await Promise.all([
    prisma.abonnement.count({ where: { suiviId: athlete.id, suiviType: "ATHLETE" } }),
    prisma.abonnement.count({ where: { suiveurId: athlete.id, suiveurType: "ATHLETE" } }),
    prisma.postLike.count({ where: { post: { auteurId: athlete.id, auteurType: "ATHLETE" } } }),
    prisma.postCommentaire.count({ where: { post: { auteurId: athlete.id, auteurType: "ATHLETE" } } }),
    prisma.postVue.count({ where: { post: { auteurId: athlete.id, auteurType: "ATHLETE" } } }),
    prisma.seanceEntrainement.findMany({
      where: { athleteId: athlete.id, date: { gte: new Date(Date.now() - 35 * 86_400_000) } },
      select: { date: true },
    }),
  ]);

  const donneesSemaine = activiteParJour(seancesRecentes, 7);
  const donneesMois = activiteParSemaine(seancesRecentes, 4);

  return (
    <div className="flex flex-col gap-6">
      <div className="card overflow-hidden">
        <div
          className="h-28 w-full"
          style={
            bannerUrl
              ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
              : { background: "linear-gradient(135deg, var(--primary-soft), var(--gold-soft))" }
          }
        />
        <div className="flex items-center gap-4 p-6 pt-0">
          <div className="-mt-8 rounded-full border-4" style={{ borderColor: "var(--surface)" }}>
            <Avatar url={athlete.avatarUrl} nom={athlete.nom} taille={64} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold">{athlete.nom}</h1>
            <p className="text-sm" style={{ color: "var(--muted)" }}>
              {athlete.sportPrincipal.nom} · {athlete.ville}
            </p>
            {mineur && (
              <span className={`chip mt-2 ${consentementValide ? "chip-success" : "chip-danger"}`}>
                {consentementValide ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
                {consentementValide ? tConsentement("statutValide") : tConsentement("statutEnAttente")}
              </span>
            )}
          </div>
        </div>
      </div>

      <BandeauStatistiquesProfil
        abonnes={abonnes}
        abonnements={abonnements}
        likes={likes}
        commentaires={commentaires}
        vues={vues}
        locale={locale}
      />

      <ResumeActiviteProfil donneesSemaine={donneesSemaine} donneesMois={donneesMois} />

      <Link href="/profil/mentions" className="card surface-hover flex items-center gap-3 p-4">
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          <AtSign size={16} />
        </div>
        <span className="text-sm font-semibold">{tMentions("voirMesMentions")}</span>
      </Link>

      <div className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
        <InfoLigne icon={Mail} label={t("email")} valeur={athlete.email} />
        <InfoLigne
          icon={Calendar}
          label={t("dateNaissance")}
          valeur={new Date(athlete.dateNaissance).toLocaleDateString(locale)}
        />
        <InfoLigne icon={MapPin} label={t("ville")} valeur={athlete.ville} />
        <InfoLigne icon={Activity} label={t("sport")} valeur={athlete.sportPrincipal.nom} />
      </div>

      {mineur && !consentementValide && (
        <ConsentementFlow
          telephoneExistant={athlete.consentement?.telephoneParent ?? null}
          codeDejaEnvoye={!!athlete.consentement}
        />
      )}

      <ParametresNomUtilisateur nomUtilisateurInitial={athlete.nomUtilisateur} />

      <ParametresAssiduite
        joursReposPlanifiesInitial={assiduite.joursReposPlanifies}
        jokersRestants={assiduite.jokersRestants}
      />

      <ParametresNotifications preferenceInitiale={athlete.preferenceNotifications} />

      <ParametresApparence
        themeFondInitial={athlete.themeFond}
        preferenceEffetsInitiale={athlete.preferenceEffetsVisuels}
        afficherFondSportInitial={athlete.afficherFondSport}
        netteteFondSportInitiale={athlete.netteteFondSport}
        nomSport={athlete.sportPrincipal.nom}
        avatarUrlInitiale={athlete.avatarUrl}
        bannerUrlInitiale={athlete.bannerUrl}
        fondEcranUrlInitiale={athlete.fondEcranUrl}
      />

      <BasculeMensurations activeInitial={athlete.suiviMensurationsActive} />
      {athlete.suiviMensurationsActive && (
        <Link href="/entrainement/mensurations" className="card surface-hover flex items-center gap-3 p-4">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            <Scale size={16} />
          </div>
          <span className="text-sm font-semibold">{tMensurations("voirMonSuivi")}</span>
        </Link>
      )}
    </div>
  );
}

function InfoLigne({
  icon: Icon,
  label,
  valeur,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  label: string;
  valeur: string;
}) {
  return (
    <div className="flex items-center gap-3 px-3 py-3">
      <div
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
        style={{ background: "var(--surface-hover)", color: "var(--muted)" }}
      >
        <Icon size={15} />
      </div>
      <div className="flex flex-1 items-center justify-between gap-4 text-sm">
        <span style={{ color: "var(--muted)" }}>{label}</span>
        <span className="font-medium">{valeur}</span>
      </div>
    </div>
  );
}
