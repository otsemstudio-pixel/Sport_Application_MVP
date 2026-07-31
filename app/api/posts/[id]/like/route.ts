import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id: postId } = await params;

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json(
        {
          error:
            "Ce profil mineur doit obtenir le consentement parental avant d'interagir avec le fil.",
        },
        { status: 403 }
      );
    }
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
  }

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  const existant = await prisma.postLike.findUnique({
    where: {
      postId_auteurId_auteurType: { postId, auteurId, auteurType: session.role },
    },
  });

  if (existant) {
    await prisma.postLike.delete({ where: { id: existant.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.postLike.create({
    data: { postId, auteurId, auteurType: session.role },
  });
  return NextResponse.json({ liked: true });
}
