import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { evaluerBadges } from "@/lib/badges";

// Les séances sont strictement privées : seul l'athlète propriétaire peut les lire ou en créer.
export async function GET() {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAutorise") }, { status: 403 });
  }

  const seances = await prisma.seance.findMany({
    where: { athleteId: session.athleteId },
    include: { defi: true },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(seances);
}

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAutorise") }, { status: 403 });
  }

  const { defiId, valeurMesuree } = await req.json();
  if (!defiId || typeof valeurMesuree !== "number") {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }

  const defi = await prisma.defi.findUnique({ where: { id: defiId } });
  if (!defi) {
    return NextResponse.json({ error: t("defiIntrouvable") }, { status: 404 });
  }

  const seance = await prisma.seance.create({
    data: {
      athleteId: session.athleteId,
      defiId,
      valeurMesuree,
    },
  });

  const nouveauxBadges = await evaluerBadges(session.athleteId);

  return NextResponse.json({ seance, nouveauxBadges }, { status: 201 });
}
