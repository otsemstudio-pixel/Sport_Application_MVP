import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Catalogue public aux athlètes connectés, comme /api/exercices.
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const categoriePerformance = req.nextUrl.searchParams.get("categoriePerformance");

  const programmes = await prisma.programme.findMany({
    where: categoriePerformance ? { categoriePerformance: categoriePerformance as never } : undefined,
    orderBy: { nom: "asc" },
  });

  return NextResponse.json(programmes);
}
