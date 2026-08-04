import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  INCLUDE_POST_RELATIONS,
  auteurIdSession,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: INCLUDE_POST_RELATIONS,
  });
  if (!post) {
    return NextResponse.json({ error: t("postIntrouvable") }, { status: 404 });
  }

  await prisma.postVue.upsert({
    where: {
      postId_spectateurId_spectateurType: {
        postId: post.id,
        spectateurId: auteurIdSession(session),
        spectateurType: session.role,
      },
    },
    update: {},
    create: { postId: post.id, spectateurId: auteurIdSession(session), spectateurType: session.role },
  });

  const commentaires = await prisma.postCommentaire.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs([post, ...commentaires]);
  const idsLikesParMoi = await idsPostsLikesParSession([post.id], session);
  const clesAbonnes = await clesAuteursAbonnesParSession([post], session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession([post.id], session);
  const fallbackNom = tCommun("utilisateur");

  return NextResponse.json({
    ...formaterPost(post, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi),
    commentaires: commentaires.map((c) => ({
      id: c.id,
      auteurType: c.auteurType,
      auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
      contenu: c.contenu,
      createdAt: c.createdAt,
    })),
  });
}

// Un post ne peut être supprimé que par son auteur.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: t("postIntrouvable") }, { status: 404 });
  }

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  if (post.auteurId !== auteurId || post.auteurType !== session.role) {
    return NextResponse.json({ error: t("nonAutorise") }, { status: 403 });
  }

  const idsCommentaires = (await prisma.postCommentaire.findMany({ where: { postId: id }, select: { id: true } })).map((c) => c.id);
  await prisma.mention.deleteMany({ where: { commentaireId: { in: idsCommentaires } } });
  await prisma.mention.deleteMany({ where: { postId: id } });
  await prisma.postHashtag.deleteMany({ where: { postId: id } });
  await prisma.postCommentaire.deleteMany({ where: { postId: id } });
  await prisma.postLike.deleteMany({ where: { postId: id } });
  await prisma.postVue.deleteMany({ where: { postId: id } });
  await prisma.postSauvegarde.deleteMany({ where: { postId: id } });
  await prisma.postImage.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
