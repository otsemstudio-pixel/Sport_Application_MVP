import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const FREQUENCES = ["DESACTIVE", "QUOTIDIEN", "QUELQUES_FOIS_SEMAINE"];

export async function PATCH(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { preferenceNotifications } = (await req.json()) as { preferenceNotifications?: string };
  if (!preferenceNotifications || !FREQUENCES.includes(preferenceNotifications)) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }

  const athlete = await prisma.athlete.update({
    where: { id: session.athleteId },
    data: { preferenceNotifications: preferenceNotifications as "DESACTIVE" | "QUOTIDIEN" | "QUELQUES_FOIS_SEMAINE" },
  });

  // Si l'athlète désactive, on retire aussi ses abonnements push : plus de
  // raison de garder un endpoint enregistré qu'on n'utilisera plus, et ça
  // évite un abonnement fantôme si la préférence est réactivée plus tard
  // sur un autre appareil sans jamais nettoyer l'ancien.
  if (preferenceNotifications === "DESACTIVE") {
    await prisma.abonnementNotification.deleteMany({ where: { athleteId: session.athleteId } });
  }

  return NextResponse.json({ preferenceNotifications: athlete.preferenceNotifications });
}
