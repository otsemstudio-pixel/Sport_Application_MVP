import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleSemaineISO } from "@/lib/ligues";

// Classement de la ligue hebdomadaire en cours de l'athlète — par XP gagné
// cette semaine, groupé ville+sport. Distinct du classement local all-time
// par nombre de séances (voir /api/classement), ne le remplace pas.
export async function GET() {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const semaine = cleSemaineISO(new Date());
  const monMembre = await prisma.ligueMembre.findFirst({
    where: { athleteId: session.athleteId, groupe: { semaine } },
    include: { groupe: true },
  });

  if (!monMembre) {
    return NextResponse.json({ semaine, groupe: null, membres: [] });
  }

  const membres = await prisma.ligueMembre.findMany({
    where: { groupeId: monMembre.groupeId },
    orderBy: { xpSemaine: "desc" },
    include: { athlete: { select: { id: true, nom: true } } },
  });

  return NextResponse.json({
    semaine,
    groupe: { niveau: monMembre.groupe.niveau, ville: monMembre.groupe.ville },
    membres: membres.map((m, index) => ({
      rang: index + 1,
      nom: m.athlete.nom,
      xpSemaine: m.xpSemaine,
      moi: m.athleteId === session.athleteId,
    })),
  });
}
