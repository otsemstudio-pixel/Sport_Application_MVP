import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function estTermine(dateDebut: Date, dureeSemaines: number) {
  const fin = new Date(dateDebut);
  fin.setDate(fin.getDate() + dureeSemaines * 7);
  return new Date() >= fin;
}

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const suivis = await prisma.athleteProgramme.findMany({
    where: { athleteId: session.athleteId },
    include: { programme: true },
    orderBy: { dateDebut: "desc" },
  });

  // Transition paresseuse EN_COURS -> TERMINE si la durée du programme est dépassée.
  const aTerminer = suivis.filter((s) => s.statut === "EN_COURS" && estTermine(s.dateDebut, s.programme.dureeSemaines));
  if (aTerminer.length > 0) {
    await prisma.athleteProgramme.updateMany({
      where: { id: { in: aTerminer.map((s) => s.id) } },
      data: { statut: "TERMINE" },
    });
    for (const s of aTerminer) s.statut = "TERMINE";
  }

  return NextResponse.json(suivis);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { programmeId } = (await req.json()) as { programmeId?: string };
  if (!programmeId) {
    return NextResponse.json({ error: "Programme requis." }, { status: 400 });
  }

  const programme = await prisma.programme.findUnique({ where: { id: programmeId } });
  if (!programme) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }

  await prisma.athleteProgramme.updateMany({
    where: { athleteId: session.athleteId, statut: "EN_COURS" },
    data: { statut: "ABANDONNE" },
  });

  const suivi = await prisma.athleteProgramme.create({
    data: { athleteId: session.athleteId, programmeId },
    include: { programme: true },
  });

  return NextResponse.json(suivi, { status: 201 });
}
