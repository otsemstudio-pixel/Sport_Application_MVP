import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { cleSemaineISO } from "@/lib/ligues";

// Résumé personnel de la semaine (séances, XP, records, position en ligue),
// affiché une fois par semaine à la première ouverture — pas de notification
// push supplémentaire pour ça (voir derniereSemaineResumeVue sur Athlete).
export async function GET() {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const semaine = cleSemaineISO(new Date());
  const athlete = await prisma.athlete.findUnique({
    where: { id: session.athleteId },
    select: { derniereSemaineResumeVue: true },
  });
  const nouveau = athlete?.derniereSemaineResumeVue !== semaine;

  const septJoursAvant = new Date(Date.now() - 7 * 86_400_000);

  const [nombreSeances, agregatXp, nouveauxRecords, membre] = await Promise.all([
    prisma.seanceEntrainement.count({ where: { athleteId: session.athleteId, date: { gte: septJoursAvant } } }),
    prisma.evenementXp.aggregate({
      where: { athleteId: session.athleteId, createdAt: { gte: septJoursAvant } },
      _sum: { montant: true },
    }),
    prisma.evenementXp.count({
      where: { athleteId: session.athleteId, type: "RECORD_PERSONNEL", createdAt: { gte: septJoursAvant } },
    }),
    prisma.ligueMembre.findFirst({
      where: { athleteId: session.athleteId, groupe: { semaine } },
      select: { xpSemaine: true, groupe: { select: { niveau: true } } },
    }),
  ]);

  return NextResponse.json({
    nouveau,
    semaine,
    nombreSeances,
    xpGagne: agregatXp._sum.montant ?? 0,
    nouveauxRecords,
    ligue: membre ? { xpSemaine: membre.xpSemaine, niveau: membre.groupe.niveau } : null,
  });
}
