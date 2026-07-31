import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PostComposer from "@/components/PostComposer";
import FilFeed from "@/components/FilFeed";
import { formaterPost, idsPostsLikesParSession, resoudreNomsAuteurs } from "@/lib/posts";

const PAGE_SIZE = 15;

export default async function FilPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    orderBy: { createdAt: "desc" },
    include: {
      images: { select: { url: true, ordre: true } },
      _count: { select: { likes: true, commentaires: true } },
    },
  });

  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);

  const postsFormates = posts.map((p) => {
    const post = formaterPost(p, noms, idsLikesParMoi, session);
    return { ...post, createdAt: post.createdAt.toISOString() };
  });

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
