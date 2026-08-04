import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import {
  INCLUDE_POST_RELATIONS,
  auteurIdSession,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";
import { NOMBRE_MAX_IMAGES } from "@/lib/upload";
import { traiterHashtagsEtMentions } from "@/lib/hashtagsMentions";

const PAGE_SIZE = 15;

export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const filtre = req.nextUrl.searchParams.get("filtre");
  const sport = req.nextUrl.searchParams.get("sport");

  type Condition =
    | { OR: { auteurId: string; auteurType: "ATHLETE" | "ORGANISATEUR" }[] }
    | { auteurType: "ATHLETE"; auteurId: { in: string[] } };
  const conditions: Condition[] = [];

  if (filtre === "abonnements") {
    const abonnements = await prisma.abonnement.findMany({
      where: { suiveurId: auteurIdSession(session), suiveurType: session.role },
      select: { suiviId: true, suiviType: true },
    });
    if (abonnements.length === 0) {
      return NextResponse.json({ posts: [], nextCursor: null });
    }
    conditions.push({ OR: abonnements.map((a) => ({ auteurId: a.suiviId, auteurType: a.suiviType })) });
  }

  // "Mon sport" n'a de sens que pour un athlète (un organisateur peut gérer
  // plusieurs sports) — le paramètre est ignoré pour toute autre session,
  // jamais dérivé d'une valeur envoyée par le client.
  if (sport === "mon-sport" && session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { sportPrincipalId: true },
    });
    if (athlete) {
      const athletesDuSport = await prisma.athlete.findMany({
        where: { sportPrincipalId: athlete.sportPrincipalId },
        select: { id: true },
      });
      if (athletesDuSport.length === 0) {
        return NextResponse.json({ posts: [], nextCursor: null });
      }
      conditions.push({ auteurType: "ATHLETE", auteurId: { in: athletesDuSport.map((a) => a.id) } });
    }
  }

  const where = conditions.length > 0 ? { AND: conditions } : undefined;

  const posts = await prisma.post.findMany({
    take: PAGE_SIZE,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    where,
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

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: t("introuvable") }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json({ error: t("mineurNonConsentiPublier") }, { status: 403 });
    }
  }

  const { contenu, images } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: t("contenuRequis") }, { status: 400 });
  }
  if (contenu.length > 500) {
    return NextResponse.json({ error: t("contenuTropLong") }, { status: 400 });
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

  await traiterHashtagsEtMentions(post.contenu, { postId: post.id });

  return NextResponse.json(post, { status: 201 });
}
