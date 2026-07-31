import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, estBloquePourConsentement } from "@/lib/auth";
import { auteurIdSession } from "@/lib/posts";

function typeVersRoleSession(type: string): "ATHLETE" | "ORGANISATEUR" | null {
  if (type === "athlete") return "ATHLETE";
  if (type === "organisateur") return "ORGANISATEUR";
  return null;
}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ type: string; id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  const { type, id: suiviId } = await params;
  const suiviType = typeVersRoleSession(type);
  if (!suiviType) {
    return NextResponse.json({ error: "Type invalide." }, { status: 400 });
  }

  const suiveurId = auteurIdSession(session);
  const suiveurType = session.role;

  if (suiveurId === suiviId && suiveurType === suiviType) {
    return NextResponse.json({ error: "Impossible de s'abonner à son propre compte." }, { status: 400 });
  }

  if (session.role === "ATHLETE") {
    const athlete = await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      include: { consentement: true },
    });
    if (!athlete) {
      return NextResponse.json({ error: "Introuvable." }, { status: 404 });
    }
    if (estBloquePourConsentement(athlete)) {
      return NextResponse.json({ error: "Ce profil mineur doit obtenir le consentement parental avant de s'abonner." }, { status: 403 });
    }
  }

  const cible =
    suiviType === "ATHLETE"
      ? await prisma.athlete.findUnique({ where: { id: suiviId } })
      : await prisma.organisateur.findUnique({ where: { id: suiviId } });
  if (!cible) {
    return NextResponse.json({ error: "Compte introuvable." }, { status: 404 });
  }

  const existant = await prisma.abonnement.findUnique({
    where: { suiveurId_suiveurType_suiviId_suiviType: { suiveurId, suiveurType, suiviId, suiviType } },
  });

  if (existant) {
    await prisma.abonnement.delete({ where: { id: existant.id } });
    return NextResponse.json({ abonne: false });
  }

  await prisma.abonnement.create({
    data: { suiveurId, suiveurType, suiviId, suiviType },
  });
  return NextResponse.json({ abonne: true });
}
