import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { code } = await req.json();
  if (!code) {
    return NextResponse.json({ error: "Code requis." }, { status: 400 });
  }

  const consentement = await prisma.consentementParental.findUnique({
    where: { athleteId: session.athleteId },
  });

  if (!consentement) {
    return NextResponse.json(
      { error: "Aucun code n'a été envoyé pour ce profil." },
      { status: 404 }
    );
  }
  if (consentement.codeValide) {
    return NextResponse.json({ ok: true, dejaValide: true });
  }
  if (consentement.code !== code) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 400 });
  }

  await prisma.consentementParental.update({
    where: { athleteId: session.athleteId },
    data: { codeValide: true, dateValidation: new Date() },
  });

  return NextResponse.json({ ok: true });
}
