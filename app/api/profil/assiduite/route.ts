import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { joursReposPlanifies } = (await req.json()) as { joursReposPlanifies?: unknown };
  if (
    !Array.isArray(joursReposPlanifies) ||
    joursReposPlanifies.length > 2 ||
    joursReposPlanifies.some((j) => typeof j !== "number" || j < 0 || j > 6 || !Number.isInteger(j))
  ) {
    return NextResponse.json({ error: t("joursReposInvalides") }, { status: 400 });
  }
  const jours = [...new Set(joursReposPlanifies)];

  const preference = await prisma.preferenceAssiduite.upsert({
    where: { athleteId: session.athleteId },
    update: { joursReposPlanifies: jours },
    create: { athleteId: session.athleteId, joursReposPlanifies: jours },
  });

  return NextResponse.json({ joursReposPlanifies: preference.joursReposPlanifies });
}
