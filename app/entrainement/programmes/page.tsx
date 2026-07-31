import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import SuivreProgrammeBouton from "@/components/SuivreProgrammeBouton";
import { ArrowLeft, CalendarRange } from "lucide-react";

export default async function ProgrammesPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const t = await getTranslations("programmes");

  const [programmes, suivis] = await Promise.all([
    prisma.programme.findMany({ orderBy: { nom: "asc" } }),
    prisma.athleteProgramme.findMany({ where: { athleteId: session.athleteId, statut: "EN_COURS" } }),
  ]);
  const suiviParProgramme = new Map(suivis.map((s) => [s.programmeId, s.id]));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/entrainement" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourEntrainement")}
      </Link>
      <h1 className="text-2xl font-bold">{t("titre")}</h1>

      {programmes.length === 0 && (
        <p className="text-sm" style={{ color: "var(--muted)" }}>
          {t("aucunProgramme")}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {programmes.map((p) => (
          <div key={p.id} className="card flex flex-col gap-3 p-5">
            <Link href={`/entrainement/programmes/${p.id}`} className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <CalendarRange size={16} style={{ color: "var(--primary)" }} />
                <h3 className="font-semibold">{p.nom}</h3>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
                {p.description}
              </p>
              <span className="chip chip-neutral self-start">{t("dureeSemaines", { n: p.dureeSemaines })}</span>
            </Link>
            <SuivreProgrammeBouton
              programmeId={p.id}
              athleteProgrammeId={suiviParProgramme.get(p.id)}
              enCours={suiviParProgramme.has(p.id)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
