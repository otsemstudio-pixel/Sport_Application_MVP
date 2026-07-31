import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { id: postId } = await params;

  const commentaires = await prisma.postCommentaire.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
  });

  const athleteIds = commentaires.filter((c) => c.auteurType === "ATHLETE").map((c) => c.auteurId);
  const organisateurIds = commentaires
    .filter((c) => c.auteurType === "ORGANISATEUR")
    .map((c) => c.auteurId);

  const [athletes, organisateurs] = await Promise.all([
    athleteIds.length
      ? prisma.athlete.findMany({ where: { id: { in: athleteIds } }, select: { id: true, nom: true } })
      : Promise.resolve([]),
    organisateurIds.length
      ? prisma.organisateur.findMany({
          where: { id: { in: organisateurIds } },
          select: { id: true, nom: true },
        })
      : Promise.resolve([]),
  ]);
  const noms = new Map<string, string>();
  athletes.forEach((a) => noms.set(`ATHLETE:${a.id}`, a.nom));
  organisateurs.forEach((o) => noms.set(`ORGANISATEUR:${o.id}`, o.nom));

  return NextResponse.json(
    commentaires.map((c) => ({
      id: c.id,
      auteurType: c.auteurType,
      auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`) ?? "Utilisateur",
      contenu: c.contenu,
      createdAt: c.createdAt,
    }))
  );
}

export async function POST(
  req: NextRequest,
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
            "Ce profil mineur doit obtenir le consentement parental avant de commenter.",
        },
        { status: 403 }
      );
    }
  }

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) {
    return NextResponse.json({ error: "Post introuvable." }, { status: 404 });
  }

  const { contenu } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }

  const commentaire = await prisma.postCommentaire.create({
    data: {
      postId,
      auteurId: session.role === "ATHLETE" ? session.athleteId : session.organisateurId,
      auteurType: session.role,
      contenu: contenu.trim(),
    },
  });

  return NextResponse.json(commentaire, { status: 201 });
}
