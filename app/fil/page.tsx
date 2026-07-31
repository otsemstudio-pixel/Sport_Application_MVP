import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostComposer from "@/components/PostComposer";
import FilFeed from "@/components/FilFeed";
import type { Post } from "@/components/PostCard";

const PAGE_SIZE = 15;

export default async function FilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { likes: true, commentaires: true } } },
  });

  const athleteIds = posts.filter((p) => p.auteurType === "ATHLETE").map((p) => p.auteurId);
  const organisateurIds = posts
    .filter((p) => p.auteurType === "ORGANISATEUR")
    .map((p) => p.auteurId);

  const [athletes, organisateurs] = await Promise.all([
    prisma.athlete.findMany({ where: { id: { in: athleteIds } }, select: { id: true, nom: true } }),
    prisma.organisateur.findMany({
      where: { id: { in: organisateurIds } },
      select: { id: true, nom: true },
    }),
  ]);
  const noms = new Map<string, string>();
  athletes.forEach((a) => noms.set(`ATHLETE:${a.id}`, a.nom));
  organisateurs.forEach((o) => noms.set(`ORGANISATEUR:${o.id}`, o.nom));

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  const mesLikes = await prisma.postLike.findMany({
    where: {
      postId: { in: posts.map((p) => p.id) },
      auteurId,
      auteurType: session.role,
    },
    select: { postId: true },
  });
  const idsLikesParMoi = new Set(mesLikes.map((l) => l.postId));

  const postsFormates: Post[] = posts.map((p) => ({
    id: p.id,
    auteurType: p.auteurType,
    auteurNom: noms.get(`${p.auteurType}:${p.auteurId}`) ?? "Utilisateur",
    contenu: p.contenu,
    imageUrl: p.imageUrl,
    createdAt: p.createdAt.toISOString(),
    nombreLikes: p._count.likes,
    nombreCommentaires: p._count.commentaires,
    likeParMoi: idsLikesParMoi.has(p.id),
    auteurCestMoi: p.auteurId === auteurId && p.auteurType === session.role,
  }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">Fil</h1>
      <PostComposer />
      <FilFeed
        postsInitiaux={postsFormates}
        curseurInitial={posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null}
      />
    </div>
  );
}
