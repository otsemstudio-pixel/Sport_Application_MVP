import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const THEMES = ["CLAIR", "SOMBRE", "SPORT"];
const EFFETS = ["AUTO", "DEGRADE", "COMPLET"];

export async function PATCH(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const body = (await req.json()) as {
    themeFond?: string;
    preferenceEffetsVisuels?: string;
    afficherFondSport?: boolean;
    netteteFondSport?: number;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    fondEcranUrl?: string | null;
  };

  const valeurs: {
    themeFond?: "CLAIR" | "SOMBRE" | "SPORT";
    preferenceEffetsVisuels?: "AUTO" | "DEGRADE" | "COMPLET";
    afficherFondSport?: boolean;
    netteteFondSport?: number;
    avatarUrl?: string | null;
    bannerUrl?: string | null;
    fondEcranUrl?: string | null;
  } = {};
  if (body.themeFond && THEMES.includes(body.themeFond)) {
    valeurs.themeFond = body.themeFond as "CLAIR" | "SOMBRE" | "SPORT";
  }
  if (body.preferenceEffetsVisuels && EFFETS.includes(body.preferenceEffetsVisuels)) {
    valeurs.preferenceEffetsVisuels = body.preferenceEffetsVisuels as "AUTO" | "DEGRADE" | "COMPLET";
  }
  if (typeof body.afficherFondSport === "boolean") valeurs.afficherFondSport = body.afficherFondSport;
  if (typeof body.netteteFondSport === "number" && Number.isFinite(body.netteteFondSport)) {
    valeurs.netteteFondSport = Math.min(100, Math.max(0, Math.round(body.netteteFondSport)));
  }
  // null = réinitialise à la valeur automatique (dérivée du sport) ; une
  // chaîne = URL choisie (upload ou galerie) ; absent = ne touche pas au champ.
  if ("avatarUrl" in body) valeurs.avatarUrl = body.avatarUrl;
  if ("bannerUrl" in body) valeurs.bannerUrl = body.bannerUrl;
  if ("fondEcranUrl" in body) valeurs.fondEcranUrl = body.fondEcranUrl;
  if (Object.keys(valeurs).length === 0) {
    return NextResponse.json({ error: "Aucune valeur valide." }, { status: 400 });
  }

  const athlete = await prisma.athlete.update({
    where: { id: session.athleteId },
    data: valeurs,
  });

  return NextResponse.json({
    themeFond: athlete.themeFond,
    preferenceEffetsVisuels: athlete.preferenceEffetsVisuels,
    afficherFondSport: athlete.afficherFondSport,
    netteteFondSport: athlete.netteteFondSport,
    avatarUrl: athlete.avatarUrl,
    bannerUrl: athlete.bannerUrl,
    fondEcranUrl: athlete.fondEcranUrl,
  });
}
