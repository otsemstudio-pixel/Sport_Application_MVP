import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const sport = req.nextUrl.searchParams.get("sport") ?? undefined;
  const defis = await prisma.defi.findMany({
    where: sport ? { sport } : undefined,
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(defis);
}
