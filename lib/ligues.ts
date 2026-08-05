import { prisma } from "@/lib/prisma";

// Clé de semaine ISO-8601 (ex. "2026-W32") — utilisée comme identifiant
// stable de cohorte de ligue, indépendant du fuseau horaire (calculé en UTC).
export function cleSemaineISO(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const jourSemaine = d.getUTCDay() || 7; // lundi=1..dimanche=7
  d.setUTCDate(d.getUTCDate() + 4 - jourSemaine);
  const anneeDebut = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const numeroSemaine = Math.ceil(((d.getTime() - anneeDebut.getTime()) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(numeroSemaine).padStart(2, "0")}`;
}

// Clôture la semaine qui vient de se terminer : classe les membres de
// chaque groupe par xpSemaine, marque le quart supérieur PROMOTION, le
// quart inférieur RELEGATION, le reste STABLE, fixe rangFinal. Un groupe
// d'1 seul membre (cas courant à l'échelle actuelle) reste STABLE — rien à
// comparer, pas de promotion artificielle.
export async function calculerCloture(reference: Date = new Date()): Promise<{ groupesClotures: number }> {
  const semaine = cleSemaineISO(new Date(reference.getTime() - 7 * 86_400_000));

  const groupes = await prisma.ligueGroupe.findMany({
    where: { semaine },
    include: { membres: { orderBy: { xpSemaine: "desc" } } },
  });

  for (const groupe of groupes) {
    const taille = groupe.membres.length;
    const quart = Math.max(1, Math.floor(taille / 4));
    for (const [index, membre] of groupe.membres.entries()) {
      const mouvement =
        taille < 2 ? "STABLE" : index < quart ? "PROMOTION" : index >= taille - quart ? "RELEGATION" : "STABLE";
      await prisma.ligueMembre.update({
        where: { id: membre.id },
        data: { rangFinal: index + 1, mouvement },
      });
    }
  }

  return { groupesClotures: groupes.length };
}

// Ouvre la nouvelle semaine : regroupe par ville+sport les athlètes ayant
// gagné de l'XP dans les 7 derniers jours, au niveau hérité de la clôture
// précédente (PROMOTION → niveau-1, RELEGATION → niveau+1, sinon inchangé ;
// niveau 1 par défaut si l'athlète n'avait pas de groupe la semaine passée).
// Idempotent (skipDuplicates) si le cron est rejoué la même semaine.
export async function ouvrirNouvelleSemaine(reference: Date = new Date()): Promise<{ groupesCrees: number }> {
  const semaine = cleSemaineISO(reference);
  const semainePrecedente = cleSemaineISO(new Date(reference.getTime() - 7 * 86_400_000));
  const septJoursAvant = new Date(reference.getTime() - 7 * 86_400_000);

  const evenementsRecents = await prisma.evenementXp.findMany({
    where: { createdAt: { gte: septJoursAvant } },
    select: { athleteId: true },
    distinct: ["athleteId"],
  });
  const athleteIds = evenementsRecents.map((e) => e.athleteId);
  if (athleteIds.length === 0) return { groupesCrees: 0 };

  const athletes = await prisma.athlete.findMany({
    where: { id: { in: athleteIds } },
    select: { id: true, ville: true, sportPrincipalId: true },
  });

  const membresPrecedents = await prisma.ligueMembre.findMany({
    where: { athleteId: { in: athleteIds }, groupe: { semaine: semainePrecedente } },
    select: { athleteId: true, mouvement: true, groupe: { select: { niveau: true } } },
  });
  const niveauParAthlete = new Map<string, number>();
  for (const m of membresPrecedents) {
    const base = m.groupe.niveau;
    const niveau =
      m.mouvement === "PROMOTION" ? Math.max(1, base - 1) : m.mouvement === "RELEGATION" ? base + 1 : base;
    niveauParAthlete.set(m.athleteId, niveau);
  }

  const groupesParCle = new Map<string, { ville: string; sportId: string; niveau: number; athleteIds: string[] }>();
  for (const a of athletes) {
    const niveau = niveauParAthlete.get(a.id) ?? 1;
    const cle = `${a.ville}::${a.sportPrincipalId}::${niveau}`;
    if (!groupesParCle.has(cle)) {
      groupesParCle.set(cle, { ville: a.ville, sportId: a.sportPrincipalId, niveau, athleteIds: [] });
    }
    groupesParCle.get(cle)!.athleteIds.push(a.id);
  }

  let groupesCrees = 0;
  for (const g of groupesParCle.values()) {
    const groupe = await prisma.ligueGroupe.upsert({
      where: { semaine_ville_sportId_niveau: { semaine, ville: g.ville, sportId: g.sportId, niveau: g.niveau } },
      update: {},
      create: { semaine, ville: g.ville, sportId: g.sportId, niveau: g.niveau },
    });
    groupesCrees++;
    await prisma.ligueMembre.createMany({
      data: g.athleteIds.map((athleteId) => ({ groupeId: groupe.id, athleteId })),
      skipDuplicates: true,
    });
  }

  return { groupesCrees };
}
