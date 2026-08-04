import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const LIMITE = 5;

// Autocomplétion #hashtag : recherche par préfixe, hashtags les plus
// récemment créés/utilisés en premier pour favoriser leur réemploi.
export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!q) return NextResponse.json([]);

  const hashtags = await prisma.hashtag.findMany({
    where: { tag: { startsWith: q } },
    orderBy: { createdAt: "desc" },
    select: { tag: true },
    take: LIMITE,
  });

  return NextResponse.json(hashtags.map((h) => ({ valeur: h.tag, libelle: `#${h.tag}` })));
}
