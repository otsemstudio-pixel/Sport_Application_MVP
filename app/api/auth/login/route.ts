import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const { role, email, password } = await req.json();

  if (!role || !email || !password) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }

  if (role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({ where: { email } });
    if (!athlete || !(await verifyPassword(password, athlete.passwordHash))) {
      return NextResponse.json({ error: t("identifiantsInvalides") }, { status: 401 });
    }
    await createSession("ATHLETE", athlete.id);
    return NextResponse.json({ id: athlete.id, role: "ATHLETE" });
  }

  if (role === "ORGANISATEUR") {
    const organisateur = await prisma.organisateur.findUnique({
      where: { email },
    });
    if (
      !organisateur ||
      !(await verifyPassword(password, organisateur.passwordHash))
    ) {
      return NextResponse.json({ error: t("identifiantsInvalides") }, { status: 401 });
    }
    await createSession("ORGANISATEUR", organisateur.id);
    return NextResponse.json({ id: organisateur.id, role: "ORGANISATEUR" });
  }

  return NextResponse.json({ error: t("roleInvalide") }, { status: 400 });
}
