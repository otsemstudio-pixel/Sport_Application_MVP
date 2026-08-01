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

  const { themeFond, preferenceEffetsVisuels } = (await req.json()) as {
    themeFond?: string;
    preferenceEffetsVisuels?: string;
  };

  const valeurs: { themeFond?: "CLAIR" | "SOMBRE" | "SPORT"; preferenceEffetsVisuels?: "AUTO" | "DEGRADE" | "COMPLET" } = {};
  if (themeFond && THEMES.includes(themeFond)) valeurs.themeFond = themeFond as "CLAIR" | "SOMBRE" | "SPORT";
  if (preferenceEffetsVisuels && EFFETS.includes(preferenceEffetsVisuels)) {
    valeurs.preferenceEffetsVisuels = preferenceEffetsVisuels as "AUTO" | "DEGRADE" | "COMPLET";
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
  });
}
