import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id } = await params;

  const objectif = await prisma.objectif.findUnique({ where: { id } });
  if (!objectif) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  if (objectif.athleteId !== session.athleteId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  await prisma.objectif.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
