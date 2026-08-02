import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const t = await getTranslations("erreurs");
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
      return NextResponse.json({ error: t("mineurNonConsentiInteraction") }, { status: 403 });
    }
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) {
    return NextResponse.json({ error: t("articleIntrouvable") }, { status: 404 });
  }

  const auteurId = session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
  const existant = await prisma.articleLike.findUnique({
    where: {
      articleId_auteurId_auteurType: { articleId, auteurId, auteurType: session.role },
    },
  });

  if (existant) {
    await prisma.articleLike.delete({ where: { id: existant.id } });
    return NextResponse.json({ liked: false });
  }

  await prisma.articleLike.create({
    data: { articleId, auteurId, auteurType: session.role },
  });
  return NextResponse.json({ liked: true });
}
