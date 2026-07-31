import { redirect } from "next/navigation";
import { getSession, isMineur } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ConsentementFlow from "@/components/ConsentementFlow";
import { Calendar, MapPin, Mail, ShieldCheck, ShieldAlert, Activity } from "lucide-react";

export default async function ProfilPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true, sportPrincipal: true },
  });
  if (!athlete) redirect("/connexion");

  const mineur = isMineur(athlete.dateNaissance);
  const consentementValide = athlete.consentement?.codeValide === true;
  const initiale = athlete.nom.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col gap-6">
      <div className="card flex items-center gap-4 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          {initiale}
        </div>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold">{athlete.nom}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {athlete.sportPrincipal.nom} · {athlete.ville}
          </p>
          {mineur && (
            <span className={`chip mt-2 ${consentementValide ? "chip-success" : "chip-danger"}`}>
              {consentementValide ? <ShieldCheck size={13} /> : <ShieldAlert size={13} />}
              {consentementValide ? "Consentement validé" : "Consentement en attente"}
            </span>
          )}
        </div>
      </div>

      <div className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
        <InfoLigne icon={Mail} label="Email" valeur={athlete.email} />
        <InfoLigne
          icon={Calendar}
          label="Date de naissance"
          valeur={new Date(athlete.dateNaissance).toLocaleDateString("fr-FR")}
        />
        <InfoLigne icon={MapPin} label="Ville" valeur={athlete.ville} />
        <InfoLigne icon={Activity} label="Sport" valeur={athlete.sportPrincipal.nom} />
      </div>

      {mineur && !consentementValide && (
        <ConsentementFlow
          telephoneExistant={athlete.consentement?.telephoneParent ?? null}
          codeDejaEnvoye={!!athlete.consentement}
        />
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
