import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const sportId = req.nextUrl.searchParams.get("sport");

  const matchs = await prisma.matchDemo.findMany({
    where: sportId ? { sportId } : undefined,
    orderBy: { dateMatch: "desc" },
    include: {
      sport: { select: { id: true, nom: true } },
      participants: { orderBy: { position: "asc" } },
    },
  });

  // Les matchs en cours passent devant (l'info la plus utile en premier),
  // le tri par statut alphabétique de Postgres ne correspond pas à l'ordre
  // de priorité voulu (EN_COURS avant A_VENIR avant TERMINE).
  const priorite: Record<string, number> = { EN_COURS: 0, A_VENIR: 1, TERMINE: 2 };
  matchs.sort((a, b) => priorite[a.statut] - priorite[b.statut]);

  return NextResponse.json({ matchs });
}
