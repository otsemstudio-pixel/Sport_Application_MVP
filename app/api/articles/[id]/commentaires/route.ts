import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { auteurIdSession, resoudreNomsAuteurs } from "@/lib/posts";

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
  const { id: articleId } = await params;

  const commentaires = await prisma.articleCommentaire.findMany({
    where: { articleId },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs(commentaires);
  const fallbackNom = tCommun("utilisateur");

  return NextResponse.json(
    commentaires.map((c) => ({
      id: c.id,
      auteurId: c.auteurId,
      auteurType: c.auteurType,
      auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
      contenu: c.contenu,
      createdAt: c.createdAt,
    }))
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
  const tCommun = await getTranslations("commun");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }
  const { id: articleId } = await params;

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: t("introuvable") }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json({ error: t("mineurNonConsentiCommentaire") }, { status: 403 });
    }
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: t("articleIntrouvable") }, { status: 404 });
  }

  const { contenu } = await req.json();
  if (!contenu || typeof contenu !== "string" || contenu.trim().length === 0) {
    return NextResponse.json({ error: t("contenuRequis") }, { status: 400 });
  }

  const commentaire = await prisma.articleCommentaire.create({
    data: {
      articleId,
      auteurId: auteurIdSession(session),
      auteurType: session.role,
      contenu: contenu.trim(),
    },
  });

  const noms = await resoudreNomsAuteurs([commentaire]);
  const fallbackNom = tCommun("utilisateur");

  return NextResponse.json(
    {
      id: commentaire.id,
      auteurId: commentaire.auteurId,
      auteurType: commentaire.auteurType,
      auteurNom: noms.get(`${commentaire.auteurType}:${commentaire.auteurId}`)?.nom ?? fallbackNom,
      contenu: commentaire.contenu,
      createdAt: commentaire.createdAt,
    },
    { status: 201 }
  );
}
