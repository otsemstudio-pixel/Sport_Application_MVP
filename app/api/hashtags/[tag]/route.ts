import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  INCLUDE_POST_RELATIONS,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";

const PAGE_SIZE = 15;

export async function GET(req: NextRequest, { params }: { params: Promise<{ tag: string }> }) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { tag } = await params;
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where: { hashtags: { some: { hashtag: { tag: tag.toLowerCase() } } } },
    orderBy: { createdAt: "desc" },
    include: INCLUDE_POST_RELATIONS,
  });

  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);
  const clesAbonnes = await clesAuteursAbonnesParSession(posts, session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession(posts.map((p) => p.id), session);
  const fallbackNom = tCommun("utilisateur");

  return NextResponse.json({
    posts: posts.map((p) => formaterPost(p, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi)),
    nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null,
  });
}
