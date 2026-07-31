import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { active } = (await req.json()) as { active?: boolean };
  if (typeof active !== "boolean") {
    return NextResponse.json({ error: "Champ 'active' requis." }, { status: 400 });
  }

  const athlete = await prisma.athlete.update({
    where: { id: session.athleteId },
    data: { suiviMensurationsActive: active },
  });

  return NextResponse.json({ suiviMensurationsActive: athlete.suiviMensurationsActive });
}
