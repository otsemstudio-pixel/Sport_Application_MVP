import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleSemaineISO } from "@/lib/ligues";

export async function POST() {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  await prisma.athlete.update({
    where: { id: session.athleteId },
    data: { derniereSemaineResumeVue: cleSemaineISO(new Date()) },
  });

  return NextResponse.json({ ok: true });
}
