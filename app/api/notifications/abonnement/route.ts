import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Enregistre/supprime la souscription Web Push du navigateur de l'athlète —
// jamais appelée sans action explicite de l'athlète dans ses réglages de
// notifications (voir ParametresNotifications.tsx).
export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { endpoint, keys } = (await req.json()) as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
  };
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }

  await prisma.abonnementNotification.upsert({
    where: { endpoint },
    update: { athleteId: session.athleteId, p256dh: keys.p256dh, auth: keys.auth },
    create: { athleteId: session.athleteId, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { endpoint } = (await req.json()) as { endpoint?: string };
  if (!endpoint) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }

  await prisma.abonnementNotification.deleteMany({ where: { athleteId: session.athleteId, endpoint } });

  return NextResponse.json({ ok: true });
}
