import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  await prisma.athlete.update({
    where: { id: session.athleteId },
    data: { onboardingComplete: true },
  });

  return NextResponse.json({ ok: true });
}
