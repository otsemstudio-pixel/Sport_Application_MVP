import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SeanceForm from "@/components/SeanceForm";
import { Flame, Lock, Medal, Trophy } from "lucide-react";

export default async function EntrainementPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
  });
  if (!athlete) redirect("/connexion");

  const [defis, badges, groupes, totalSeances] = await Promise.all([
    prisma.defi.findMany({ where: { sport: athlete.sport }, orderBy: { nom: "asc" } }),
    prisma.badge.findMany({ orderBy: { seuilSeances: "asc" } }),
    prisma.seance.groupBy({
      by: ["athleteId"],
      where: { athlete: { ville: athlete.ville, sport: athlete.sport } },
      _count: { _all: true },
      orderBy: { _count: { athleteId: "desc" } },
      take: 20,
    }),
    prisma.seance.count({ where: { athleteId: athlete.id } }),
  ]);

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
    nom: nomParId.get(g.athleteId) ?? "Athlète",
    nombreSeances: g._count._all,
    moi: g.athleteId === athlete.id,
  }));
  const monRang = classement.find((c) => c.moi)?.rang ?? null;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold">Entraînement</h1>
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {athlete.sport.charAt(0).toUpperCase() + athlete.sport.slice(1)} · {athlete.ville}
        </p>
      </div>

      <section className="grid grid-cols-3 gap-3">
        <StatCard icon={Flame} valeur={totalSeances} label="Séances" />
        <StatCard icon={Medal} valeur={idsObtenus.size} label="Badges" />
        <StatCard icon={Trophy} valeur={monRang ? `#${monRang}` : "—"} label="Rang local" />
      </section>

      <section className="card flex flex-col gap-4 p-5">
        <h2 className="font-semibold">Enregistrer une séance</h2>
        <SeanceForm defis={defis} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Badges</h2>
        <div className="grid grid-cols-3 gap-3">
          {badges.map((badge) => {
            const obtenu = idsObtenus.has(badge.id);
            return (
              <div
                key={badge.id}
                className="card flex flex-col items-center gap-1.5 p-3 text-center"
                style={
                  obtenu
                    ? { borderColor: "var(--gold)", background: "var(--gold-soft)" }
                    : { opacity: 0.55 }
                }
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full"
                  style={{
                    background: obtenu ? "var(--gold-soft)" : "var(--surface-hover)",
                    color: obtenu ? "var(--gold)" : "var(--muted)",
                  }}
                >
                  {obtenu ? <Medal size={18} /> : <Lock size={16} />}
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

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">Classement local ({athlete.ville})</h2>
        {classement.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Aucune séance enregistrée pour l&apos;instant dans ta ville.
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
                    {c.nom} {c.moi && <span style={{ color: "var(--primary)" }}>(toi)</span>}
                  </span>
                </div>
                <span style={{ color: "var(--muted)" }}>{c.nombreSeances} séances</span>
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
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  valeur: string | number;
  label: string;
}) {
  return (
    <div className="card flex flex-col items-center gap-1 py-4">
      <Icon size={18} style={{ color: "var(--primary)" }} />
      <span className="text-lg font-bold">{valeur}</span>
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
