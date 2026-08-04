import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import HashtagFeed from "@/components/HashtagFeed";
import {
  INCLUDE_POST_RELATIONS,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";
import { ArrowLeft, Hash } from "lucide-react";

const PAGE_SIZE = 15;

export default async function HashtagPage({ params }: { params: Promise<{ tag: string }> }) {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const { tag: tagBrut } = await params;
  const tag = tagBrut.toLowerCase();
  const t = await getTranslations("hashtag");
  const tCommun = await getTranslations("commun");

  const [nombreTotal, posts] = await Promise.all([
    prisma.postHashtag.count({ where: { hashtag: { tag } } }),
    prisma.post.findMany({
      take: PAGE_SIZE,
      where: { hashtags: { some: { hashtag: { tag } } } },
      orderBy: { createdAt: "desc" },
      include: INCLUDE_POST_RELATIONS,
    }),
  ]);

  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);
  const clesAbonnes = await clesAuteursAbonnesParSession(posts, session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession(posts.map((p) => p.id), session);
  const fallbackNom = tCommun("utilisateur");

  const postsFormates = posts.map((p) => {
    const post = formaterPost(p, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi);
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      seance: post.seance ? { ...post.seance, date: post.seance.date.toISOString() } : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourFil")}
      </Link>

      <div>
        <h1 className="flex items-center gap-1.5 text-2xl font-bold">
          <Hash size={22} style={{ color: "var(--primary)" }} />
          {tag}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t("nombrePosts", { n: nombreTotal })}
        </p>
      </div>

      <HashtagFeed
        tag={tag}
        postsInitiaux={postsFormates}
        curseurInitial={posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null}
      />
    </div>
  );
}
