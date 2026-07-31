import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

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
  await prisma.post.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
