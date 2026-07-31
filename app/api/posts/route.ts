import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { auteurIdSession, formaterPost, idsPostsLikesParSession, resoudreNomsAuteurs } from "@/lib/posts";
import { NOMBRE_MAX_IMAGES } from "@/lib/upload";

const PAGE_SIZE = 15;

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
    include: {
      images: { select: { url: true, ordre: true } },
      _count: { select: { likes: true, commentaires: true } },
    },
  });

  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);

  return NextResponse.json({
    posts: posts.map((p) => formaterPost(p, noms, idsLikesParMoi, session)),
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

  const { contenu, images } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
  }
  if (contenu.length > 500) {
    return NextResponse.json(
      { error: "Le contenu est limité à 500 caractères." },
      { status: 400 }
    );
  }
  const urlsImages: string[] = Array.isArray(images) ? images.slice(0, NOMBRE_MAX_IMAGES) : [];

  const post = await prisma.post.create({
    data: {
      auteurId: auteurIdSession(session),
      auteurType: session.role,
      contenu: contenu.trim(),
      images: {
        create: urlsImages.map((url, index) => ({ url, ordre: index })),
      },
    },
    include: { images: true },
  });

  return NextResponse.json(post, { status: 201 });
}
