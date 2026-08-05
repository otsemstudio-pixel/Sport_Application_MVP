import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { attribuerXp } from "@/lib/xp";

const STATUTS_VALIDES = ["EN_ATTENTE", "CONFIRME", "REFUSE"];

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; inscriptionId: string }> }
) {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }
  const { id: evenementId, inscriptionId } = await params;

  const evenement = await prisma.evenement.findUnique({
    where: { id: evenementId },
  });
  if (!evenement || evenement.organisateurId !== session.organisateurId) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const { statut } = await req.json();
  if (!STATUTS_VALIDES.includes(statut)) {
    return NextResponse.json({ error: "Statut invalide." }, { status: 400 });
  }

  const inscription = await prisma.inscription.findUnique({
    where: { id: inscriptionId },
  });
  if (!inscription || inscription.evenementId !== evenementId) {
    return NextResponse.json(
      { error: "Inscription introuvable." },
      { status: 404 }
    );
  }

  const misAJour = await prisma.inscription.update({
    where: { id: inscriptionId },
    data: { statut },
  });

  if (statut === "CONFIRME" && inscription.statut !== "CONFIRME") {
    await attribuerXp(inscription.athleteId, "INSCRIPTION_TOURNOI");
  }

  return NextResponse.json(misAJour);
}
