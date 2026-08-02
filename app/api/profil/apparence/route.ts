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

  const { themeFond, preferenceEffetsVisuels, afficherFondSport, netteteFondSport } = (await req.json()) as {
    themeFond?: string;
    preferenceEffetsVisuels?: string;
    afficherFondSport?: boolean;
    netteteFondSport?: number;
  };

  const valeurs: {
    themeFond?: "CLAIR" | "SOMBRE" | "SPORT";
    preferenceEffetsVisuels?: "AUTO" | "DEGRADE" | "COMPLET";
    afficherFondSport?: boolean;
    netteteFondSport?: number;
  } = {};
  if (themeFond && THEMES.includes(themeFond)) valeurs.themeFond = themeFond as "CLAIR" | "SOMBRE" | "SPORT";
  if (preferenceEffetsVisuels && EFFETS.includes(preferenceEffetsVisuels)) {
    valeurs.preferenceEffetsVisuels = preferenceEffetsVisuels as "AUTO" | "DEGRADE" | "COMPLET";
  }
  if (typeof afficherFondSport === "boolean") valeurs.afficherFondSport = afficherFondSport;
  if (typeof netteteFondSport === "number" && Number.isFinite(netteteFondSport)) {
    valeurs.netteteFondSport = Math.min(100, Math.max(0, Math.round(netteteFondSport)));
  }
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
  });
}
