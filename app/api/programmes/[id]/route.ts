import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id } = await params;

  const programme = await prisma.programme.findUnique({
    where: { id },
    include: {
      seances: {
        orderBy: [{ numeroSemaine: "asc" }, { numeroJour: "asc" }],
        include: { exercicesPrevus: { include: { exercice: true } } },
      },
    },
  });
  if (!programme) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  return NextResponse.json(programme);
}
