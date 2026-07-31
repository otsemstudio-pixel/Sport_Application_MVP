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
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAutorise") }, { status: 403 });
  }
  const { id: evenementId } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    include: { consentement: true },
  });
  if (!athlete) {
    return NextResponse.json({ error: t("introuvable") }, { status: 404 });
  }

  if (estBloquePourConsentement(athlete)) {
    return NextResponse.json({ error: t("mineurNonConsentiInscription") }, { status: 403 });
  }

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
    include: { _count: { select: { inscriptions: true } } },
  });
  if (!evenement) {
    return NextResponse.json({ error: t("evenementIntrouvable") }, { status: 404 });
  }

  const dejaInscrit = await prisma.inscription.findUnique({
    where: {
      evenementId_athleteId: { evenementId, athleteId: athlete.id },
    },
  });
  if (dejaInscrit) {
    return NextResponse.json({ error: t("dejaInscrit") }, { status: 409 });
  }

  if (evenement._count.inscriptions >= evenement.placesMax) {
    return NextResponse.json({ error: t("evenementComplet") }, { status: 409 });
  }

  const inscription = await prisma.inscription.create({
    data: { evenementId, athleteId: athlete.id },
  });

  return NextResponse.json(inscription, { status: 201 });
}
