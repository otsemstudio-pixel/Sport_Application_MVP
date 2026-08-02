import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { id: postId } = await params;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: t("postIntrouvable") }, { status: 404 });
  }

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  const existant = await prisma.postSauvegarde.findUnique({
    where: {
      postId_auteurId_auteurType: { postId, auteurId, auteurType: session.role },
    },
  });

  if (existant) {
    await prisma.postSauvegarde.delete({ where: { id: existant.id } });
    return NextResponse.json({ sauvegarde: false });
  }

  await prisma.postSauvegarde.create({
    data: { postId, auteurId, auteurType: session.role },
  });
  return NextResponse.json({ sauvegarde: true });
}
