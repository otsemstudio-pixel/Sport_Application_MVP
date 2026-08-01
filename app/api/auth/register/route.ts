import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createSession, hashPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const body = await req.json();
  const { role, email, password, nom } = body;

  if (!role || !email || !password || !nom) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 6) {
    return NextResponse.json({ error: t("motDePasseCourt") }, { status: 400 });
  }

  if (role === "ATHLETE") {
    const { dateNaissance, ville, sportId } = body;
    if (!dateNaissance || !ville || !sportId) {
      return NextResponse.json({ error: t("champsManquantsAthlete") }, { status: 400 });
    }

    const sport = await prisma.sport.findUnique({ where: { id: sportId } });
    if (!sport) {
      return NextResponse.json({ error: t("sportInvalide") }, { status: 400 });
    }

    const existant = await prisma.athlete.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json({ error: t("emailDejaUtilise") }, { status: 409 });
    }

    const athlete = await prisma.athlete.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        nom,
        dateNaissance: new Date(dateNaissance),
        ville,
        sportPrincipalId: sportId,
        onboardingComplete: false,
      },
    });

    await createSession("ATHLETE", athlete.id);
    return NextResponse.json({ id: athlete.id, role: "ATHLETE" }, { status: 201 });
  }

  if (role === "ORGANISATEUR") {
    const existant = await prisma.organisateur.findUnique({ where: { email } });
    if (existant) {
      return NextResponse.json({ error: t("emailDejaUtilise") }, { status: 409 });
    }

    const organisateur = await prisma.organisateur.create({
      data: {
        email,
        passwordHash: await hashPassword(password),
        nom,
      },
    });

    await createSession("ORGANISATEUR", organisateur.id);
    return NextResponse.json(
      { id: organisateur.id, role: "ORGANISATEUR" },
      { status: 201 }
    );
  }

  return NextResponse.json({ error: t("roleInvalide") }, { status: 400 });
}
