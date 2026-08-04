import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import FondSport from "@/components/FondSport";
import ActualitesFeed from "@/components/ActualitesFeed";
import { resoudreFondEcran } from "@/lib/sportBackgrounds";
import { formaterActualite } from "@/lib/actualites";

const PAGE_SIZE = 15;

export default async function ActualitesPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const t = await getTranslations("actualites");

  let fondSportUrl: string | null = null;
  let netteteFondSport = 40;
  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: {
        afficherFondSport: true,
        netteteFondSport: true,
        fondEcranUrl: true,
        sportPrincipal: { select: { nom: true } },
      },
    });
    if (athlete) {
      netteteFondSport = athlete.netteteFondSport;
      if (athlete.afficherFondSport) {
        fondSportUrl = resoudreFondEcran(athlete);
      }
    }
  }

  const [sports, actualites] = await Promise.all([
    prisma.sport.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    prisma.actualite.findMany({ take: PAGE_SIZE, orderBy: { publieLe: "desc" } }),
  ]);
  const actualitesFormatees = actualites.map((a) => {
    const f = formaterActualite(a);
    return { ...f, publieLe: f.publieLe.toISOString() };
  });

  return (
    <div className="flex flex-col gap-6">
      {fondSportUrl && <FondSport imageUrl={fondSportUrl} nettete={netteteFondSport} />}
      <div>
        <h1 className="text-2xl font-bold">{t("titre")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t("sousTitre")}
        </p>
      </div>
      <ActualitesFeed
        sports={sports}
        actualitesInitiales={actualitesFormatees}
        curseurInitial={actualites.length === PAGE_SIZE ? actualites[actualites.length - 1].id : null}
      />
    </div>
  );
}
