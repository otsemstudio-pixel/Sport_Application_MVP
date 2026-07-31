import { prisma } from "@/lib/prisma";

// Évalue les paliers de séances et débloque les badges manquants pour un athlète.
export async function evaluerBadges(athleteId: string) {
  const nbSeances = await prisma.seance.count({ where: { athleteId } });

  const badgesEligibles = await prisma.badge.findMany({
    where: { seuilSeances: { lte: nbSeances } },
  });

  const badgesDejaObtenus = await prisma.athleteBadge.findMany({
    where: { athleteId },
    select: { badgeId: true },
  });
  const idsDejaObtenus = new Set(badgesDejaObtenus.map((b) => b.badgeId));

  const nouveaux = badgesEligibles.filter((b) => !idsDejaObtenus.has(b.id));

  if (nouveaux.length > 0) {
    await prisma.athleteBadge.createMany({
      data: nouveaux.map((b) => ({ athleteId, badgeId: b.id })),
    });
  }

  return nouveaux;
}
