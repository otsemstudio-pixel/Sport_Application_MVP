import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Quitter un programme suivi.
export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id } = await params;

  const suivi = await prisma.athleteProgramme.findUnique({ where: { id } });
  if (!suivi) {
    return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  }
  if (suivi.athleteId !== session.athleteId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const misAJour = await prisma.athleteProgramme.update({
    where: { id },
    data: { statut: "ABANDONNE" },
  });

  return NextResponse.json(misAJour);
}
