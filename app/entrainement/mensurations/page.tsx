import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import MensurationsPanel from "@/components/MensurationsPanel";
import { ArrowLeft } from "lucide-react";

// Écran strictement privé, accessible uniquement à l'athlète lui-même et
// uniquement si le suivi a été explicitement activé — sinon redirection,
// pas un simple masquage côté client.
export default async function MensurationsPage() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");

  const athlete = await prisma.athlete.findUnique({ where: { id: session.athleteId } });
  if (!athlete) redirect("/connexion");
  if (!athlete.suiviMensurationsActive) redirect("/profil");

  const t = await getTranslations("mensurations");

  const mensurations = await prisma.mensuration.findMany({
    where: { athleteId: athlete.id },
    orderBy: { date: "asc" },
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/profil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourProfil")}
      </Link>
      <h1 className="text-2xl font-bold">{t("titre")}</h1>

      <MensurationsPanel
        mensurationsInitiales={mensurations.map((m) => ({
          id: m.id,
          date: m.date.toISOString(),
          poidsKg: m.poidsKg,
          tailleCm: m.tailleCm,
        }))}
      />
    </div>
  );
}
