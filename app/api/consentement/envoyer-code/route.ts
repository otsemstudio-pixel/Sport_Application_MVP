import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, isMineur } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { telephoneParent } = await req.json();
  if (!telephoneParent) {
    return NextResponse.json(
      { error: "Numéro de téléphone du parent requis." },
      { status: 400 }
    );
  }

  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
  });
  if (!athlete) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  if (!isMineur(athlete.dateNaissance)) {
    return NextResponse.json(
      { error: "Ce profil n'est pas mineur, aucun consentement requis." },
      { status: 400 }
    );
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
