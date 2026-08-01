import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import PostComposer from "@/components/PostComposer";
import FilFeed from "@/components/FilFeed";
import { INCLUDE_POST_RELATIONS, formaterPost, idsPostsLikesParSession, resoudreNomsAuteurs } from "@/lib/posts";

const PAGE_SIZE = 15;

export default async function FilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const t = await getTranslations("fil");
  const tCommun = await getTranslations("commun");

  // Par défaut, un athlète ne voit que les posts de son sport principal
  // (les posts d'organisateur n'ont pas de sport unique, donc pas de place
  // dans cette vue par défaut — visibles via "Tous les sports").
  let where: { auteurType: "ATHLETE"; auteurId: { in: string[] } } | undefined;
  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { sportPrincipalId: true },
    });
    if (athlete) {
      const athletesDuSport = await prisma.athlete.findMany({
        where: { sportPrincipalId: athlete.sportPrincipalId },
        select: { id: true },
      });
      where = { auteurType: "ATHLETE", auteurId: { in: athletesDuSport.map((a) => a.id) } };
    }
  }

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    where,
    orderBy: { createdAt: "desc" },
    include: INCLUDE_POST_RELATIONS,
  });

  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);
  const fallbackNom = tCommun("utilisateur");

  const postsFormates = posts.map((p) => {
    const post = formaterPost(p, noms, idsLikesParMoi, session, fallbackNom);
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      seance: post.seance ? { ...post.seance, date: post.seance.date.toISOString() } : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t("titre")}</h1>
      <PostComposer />
      <FilFeed
        postsInitiaux={postsFormates}
        curseurInitial={posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null}
        estAthlete={session.role === "ATHLETE"}
      />
    </div>
  );
}
