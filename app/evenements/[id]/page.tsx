import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ImageCarousel from "@/components/ImageCarousel";
import InscriptionButton from "@/components/InscriptionButton";
import {
  ArrowLeft,
  Banknote,
  Calendar,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";

const LABELS_NIVEAU: Record<string, string> = {
  DEBUTANT: "Débutant",
  INTERMEDIAIRE: "Intermédiaire",
  AVANCE: "Avancé",
  TOUS_NIVEAUX: "Tous niveaux",
};

export default async function EvenementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id },
    include: {
      sport: { select: { nom: true } },
      organisateur: { select: { nom: true, verifie: true } },
      images: { select: { url: true }, orderBy: { ordre: "asc" } },
      _count: { select: { inscriptions: true } },
    },
  });
  if (!evenement) notFound();

  let bloque = false;
  let statutInscription: string | undefined;
  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (athlete) bloque = estBloquePourConsentement(athlete);

    const inscription = await prisma.inscription.findUnique({
      where: { evenementId_athleteId: { evenementId: id, athleteId: session.athleteId } },
    });
    statutInscription = inscription?.statut;
  }

  const placesRestantes = evenement.placesMax - evenement._count.inscriptions;
  const complet = placesRestantes <= 0;
  const ouvertDebutants = evenement.niveauRequis === "DEBUTANT" || evenement.niveauRequis === "TOUS_NIVEAUX";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/tournois" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        Retour aux tournois
      </Link>

      <div className="card overflow-hidden">
        {evenement.images.length > 0 ? (
          <div className="p-2">
            <ImageCarousel images={evenement.images.map((i) => i.url)} />
          </div>
        ) : (
          <div
            className="flex h-48 w-full items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--primary-soft), var(--gold-soft))" }}
          >
            <Trophy size={44} style={{ color: "var(--primary)" }} />
          </div>
        )}

        <div className="flex flex-col gap-4 p-5">
          <div>
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-bold">{evenement.nom}</h1>
              <span className={`chip shrink-0 ${complet ? "chip-danger" : "chip-primary"}`}>
                {complet ? "Complet" : `${placesRestantes} places`}
              </span>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
              {evenement.sport.nom} · Organisé par {evenement.organisateur.nom}
              {evenement.organisateur.verifie && (
                <ShieldCheck size={13} className="ml-1 inline" style={{ color: "var(--success)" }} />
              )}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {ouvertDebutants && (
              <span className="chip chip-success">
                <GraduationCap size={12} />
                Ouvert aux débutants
              </span>
            )}
            {!evenement.clubRequis && <span className="chip chip-success">Sans club requis</span>}
          </div>

          <p className="whitespace-pre-wrap text-sm leading-relaxed">{evenement.description}</p>

          <div className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
            <Ligne icon={MapPin} label="Lieu" valeur={evenement.lieu} />
            <Ligne icon={Calendar} label="Date" valeur={new Date(evenement.date).toLocaleDateString("fr-FR")} />
            <Ligne icon={Users} label="Places" valeur={`${evenement._count.inscriptions}/${evenement.placesMax}`} />
            <Ligne icon={GraduationCap} label="Niveau requis" valeur={LABELS_NIVEAU[evenement.niveauRequis]} />
            <Ligne icon={ShieldCheck} label="Club requis" valeur={evenement.clubRequis ? "Oui" : "Non"} />
            {(evenement.ageMin || evenement.ageMax) && (
              <Ligne
                icon={Users}
                label="Âge"
                valeur={[
                  evenement.ageMin ? `min ${evenement.ageMin} ans` : null,
                  evenement.ageMax ? `max ${evenement.ageMax} ans` : null,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              />
            )}
            {evenement.nombreEquipesMax && (
              <Ligne icon={Users} label="Équipes max" valeur={String(evenement.nombreEquipesMax)} />
            )}
            {evenement.equipementFourni && (
              <Ligne icon={Trophy} label="Équipement" valeur={evenement.equipementFourni} />
            )}
            <Ligne
              icon={Banknote}
              label="Frais d'inscription"
              valeur={evenement.fraisInscription > 0 ? `${evenement.fraisInscription} FCFA` : "Gratuit"}
            />
          </div>

          {session.role === "ATHLETE" && (
            <InscriptionButton
              evenementId={evenement.id}
              complet={complet}
              bloque={bloque}
              statutInscription={statutInscription}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Ligne({
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
