import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { formaterPost, idsPostsLikesParSession, resoudreNomsAuteurs } from "@/lib/posts";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      images: { select: { url: true, ordre: true } },
      _count: { select: { likes: true, commentaires: true } },
    },
  });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
  }

  const commentaires = await prisma.postCommentaire.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs([post, ...commentaires]);
  const idsLikesParMoi = await idsPostsLikesParSession([post.id], session);

  return NextResponse.json({
    ...formaterPost(post, noms, idsLikesParMoi, session),
    commentaires: commentaires.map((c) => ({
      id: c.id,
      auteurType: c.auteurType,
      auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`) ?? "Utilisateur",
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
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id } = await params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
  }

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  if (post.auteurId !== auteurId || post.auteurType !== session.role) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  await prisma.postCommentaire.deleteMany({ where: { postId: id } });
  await prisma.postLike.deleteMany({ where: { postId: id } });
  await prisma.postImage.deleteMany({ where: { postId: id } });
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
