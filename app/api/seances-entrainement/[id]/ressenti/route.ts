import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const RESSENTIS = ["DIFFICILE", "CORRECT", "FACILE"];

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { id } = await params;
  const { ressenti } = (await req.json()) as { ressenti?: string };
  if (!ressenti || !RESSENTIS.includes(ressenti)) {
    return NextResponse.json({ error: "Ressenti invalide." }, { status: 400 });
  }

  const seance = await prisma.seanceEntrainement.findUnique({ where: { id } });
  if (!seance || seance.athleteId !== session.athleteId) {
    return NextResponse.json({ error: "Séance introuvable." }, { status: 404 });
  }

  const retour = await prisma.retourSeance.upsert({
    where: { seanceId: id },
    create: { seanceId: id, ressenti: ressenti as "DIFFICILE" | "CORRECT" | "FACILE" },
    update: { ressenti: ressenti as "DIFFICILE" | "CORRECT" | "FACILE" },
  });

  return NextResponse.json(retour, { status: 201 });
}
