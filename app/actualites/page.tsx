import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import FondSport from "@/components/FondSport";
import ActualitesFeed from "@/components/ActualitesFeed";
import { resoudreFondEcran } from "@/lib/sportBackgrounds";
import { INCLUDE_ARTICLE_RELATIONS, formaterArticle, idsArticlesLikesParSession } from "@/lib/articles";

const PAGE_SIZE = 10;

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

  const [sports, matchs, articles] = await Promise.all([
    prisma.sport.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } }),
    prisma.matchDemo.findMany({
      orderBy: { dateMatch: "desc" },
      include: {
        sport: { select: { id: true, nom: true } },
        participants: { orderBy: { position: "asc" } },
      },
    }),
    prisma.article.findMany({
      take: PAGE_SIZE,
      orderBy: { publieLe: "desc" },
      include: INCLUDE_ARTICLE_RELATIONS,
    }),
  ]);

  const priorite: Record<string, number> = { EN_COURS: 0, A_VENIR: 1, TERMINE: 2 };
  matchs.sort((a, b) => priorite[a.statut] - priorite[b.statut]);

  const idsLikesParMoi = await idsArticlesLikesParSession(articles.map((a) => a.id), session);
  const articlesFormates = articles.map((a) => {
    const article = formaterArticle(a, idsLikesParMoi);
    return { ...article, publieLe: article.publieLe.toISOString() };
  });
  const matchsFormates = matchs.map((m) => ({
    ...m,
    dateMatch: m.dateMatch.toISOString(),
    participants: m.participants.map((p) => ({ id: p.id, position: p.position, nom: p.nom, resultat: p.resultat })),
  }));

  return (
    <div className="flex flex-col gap-6">
      {fondSportUrl && <FondSport imageUrl={fondSportUrl} nettete={netteteFondSport} />}
      <h1 className="text-2xl font-bold">{t("titre")}</h1>
      <ActualitesFeed
        sports={sports}
        matchsInitiaux={matchsFormates}
        articlesInitiaux={articlesFormates}
        curseurInitial={articles.length === PAGE_SIZE ? articles[articles.length - 1].id : null}
      />
    </div>
  );
}
