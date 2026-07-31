import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

const PAGE_SIZE = 15;

async function resoudreAuteurs(
  posts: { auteurId: string; auteurType: "ATHLETE" | "ORGANISATEUR" }[]
) {
  const athleteIds = posts.filter((p) => p.auteurType === "ATHLETE").map((p) => p.auteurId);
  const organisateurIds = posts
    .filter((p) => p.auteurType === "ORGANISATEUR")
    .map((p) => p.auteurId);

  const [athletes, organisateurs] = await Promise.all([
    athleteIds.length
      ? prisma.athlete.findMany({
          where: { id: { in: athleteIds } },
          select: { id: true, nom: true },
        })
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
  return noms;
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { likes: true, commentaires: true } } },
  });

  const noms = await resoudreAuteurs(posts);

  const meCle =
    session.role === "ATHLETE" ? `ATHLETE:${session.athleteId}` : `ORGANISATEUR:${session.organisateurId}`;
  const mesLikes = await prisma.postLike.findMany({
    where: {
      postId: { in: posts.map((p) => p.id) },
      auteurId: session.role === "ATHLETE" ? session.athleteId : session.organisateurId,
      auteurType: session.role,
    },
    select: { postId: true },
  });
  const idsLikesParMoi = new Set(mesLikes.map((l) => l.postId));

  return NextResponse.json({
    posts: posts.map((p) => ({
      id: p.id,
      auteurId: p.auteurId,
      auteurType: p.auteurType,
      auteurNom: noms.get(`${p.auteurType}:${p.auteurId}`) ?? "Utilisateur",
      contenu: p.contenu,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
      nombreLikes: p._count.likes,
      nombreCommentaires: p._count.commentaires,
      likeParMoi: idsLikesParMoi.has(p.id),
      auteurCestMoi: `${p.auteurType}:${p.auteurId}` === meCle,
    })),
    nextCursor: posts.length === PAGE_SIZE ? posts[posts.length - 1].id : null,
  });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

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
            "Ce profil mineur doit obtenir le consentement parental avant de publier.",
        },
        { status: 403 }
      );
    }
  }

  const { contenu, imageUrl } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }
  if (contenu.length > 500) {
    return NextResponse.json(
      { error: "Le contenu est limité à 500 caractères." },
      { status: 400 }
    );
  }

  const post = await prisma.post.create({
    data: {
      auteurId: session.role === "ATHLETE" ? session.athleteId : session.organisateurId,
      auteurType: session.role,
      contenu: contenu.trim(),
      imageUrl: imageUrl || null,
    },
  });

  return NextResponse.json(post, { status: 201 });
}
