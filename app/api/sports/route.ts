import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Route publique : la liste des sports est nécessaire avant même l'inscription.
export async function GET() {
  const sports = await prisma.sport.findMany({
    orderBy: [{ categoriePerformance: "asc" }, { nom: "asc" }],
  });
  return NextResponse.json(sports);
}
