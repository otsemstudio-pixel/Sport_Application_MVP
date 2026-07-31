import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession, verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { role, email, password } = await req.json();

  if (!role || !email || !password) {
    return NextResponse.json({ error: "Champs manquants." }, { status: 400 });
  }

  if (role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({ where: { email } });
    if (!athlete || !(await verifyPassword(password, athlete.passwordHash))) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }
    await createSession("ORGANISATEUR", organisateur.id);
    return NextResponse.json({ id: organisateur.id, role: "ORGANISATEUR" });
  }

  return NextResponse.json({ error: "Rôle invalide." }, { status: 400 });
}
