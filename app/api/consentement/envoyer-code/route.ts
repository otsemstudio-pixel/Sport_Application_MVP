import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession, isMineur } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAutorise") }, { status: 403 });
  }

  const { telephoneParent } = await req.json();
  if (!telephoneParent) {
    return NextResponse.json({ error: t("aucunTelephone") }, { status: 400 });
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
  });
  if (!athlete) {
    return NextResponse.json({ error: t("introuvable") }, { status: 404 });
  }
  if (!isMineur(athlete.dateNaissance)) {
    return NextResponse.json({ error: t("profilPasMineur") }, { status: 400 });
  }

  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const consentement = await prisma.consentementParental.upsert({
    where: { athleteId: athlete.id },
    update: { telephoneParent, code, codeValide: false, dateValidation: null },
    create: {
      athleteId: athlete.id,
      telephoneParent,
      code,
    },
  });

  // Simulation d'envoi de SMS pour le MVP : le code est simplement journalisé.
  console.log(
    `[SMS simulé] Code de consentement parental pour ${athlete.nom} (${telephoneParent}) : ${code}`
  );

  return NextResponse.json({
    ok: true,
    telephoneParent: consentement.telephoneParent,
  });
}
