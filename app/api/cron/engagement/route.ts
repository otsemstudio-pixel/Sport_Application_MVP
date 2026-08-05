import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { attribuerXp } from "@/lib/xp";
import { calculerCloture, ouvrirNouvelleSemaine } from "@/lib/ligues";
import { envoyerNotificationPush } from "@/lib/push";
import messagesFr from "@/messages/fr.json";

// Fréquence "quelques fois par semaine" : lundi/mercredi/vendredi, un
// compromis simple sans réglage plus fin (conforme au document — trois
// options nommées seulement : quotidien / quelques fois par semaine /
// désactivé).
const JOURS_QUELQUES_FOIS_SEMAINE = [1, 3, 5];

// Déclenché par Vercel Cron (voir vercel.json), même pattern d'authentification
// que app/api/cron/actualites. Un seul cron quotidien consolidé (budget de
// crons limité sur le plan Vercel Hobby) qui fait, dans l'ordre : (1) la
// clôture + réouverture hebdomadaire des ligues si on est lundi, (2)
// l'attribution de l'XP "repos planifié respecté" du jour, (3) le dispatch
// des notifications push. Horaire fixe unique pour tout le monde : la
// personnalisation par athlète porte sur le CONTENU et sur le fait de ne
// jamais déranger quelqu'un déjà actif aujourd'hui, pas sur l'heure d'envoi
// (le plan Hobby ne permet qu'un cron/jour à horaire fixe).
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const autorisation = req.headers.get("authorization");
  if (!secret || autorisation !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const maintenant = new Date();
  const debutJour = new Date(maintenant);
  debutJour.setUTCHours(0, 0, 0, 0);
  const jourSemaineUTC = maintenant.getUTCDay(); // 0=dimanche..6=samedi, 1=lundi

  let ligues: { groupesClotures: number; groupesCrees: number } | null = null;
  if (jourSemaineUTC === 1) {
    const cloture = await calculerCloture(maintenant).catch((e) => {
      console.error("[cron engagement] Échec clôture ligues:", e instanceof Error ? e.message : e);
      return { groupesClotures: 0 };
    });
    const ouverture = await ouvrirNouvelleSemaine(maintenant).catch((e) => {
      console.error("[cron engagement] Échec ouverture ligues:", e instanceof Error ? e.message : e);
      return { groupesCrees: 0 };
    });
    ligues = { ...cloture, ...ouverture };
  }

  // XP "repos planifié respecté" : pour chaque athlète dont aujourd'hui est
  // un jour de repos planifié, sans séance déjà enregistrée aujourd'hui
  // (sinon l'athlète a de toute façon l'XP "séance complétée", pas la peine
  // d'ajouter un second signal contradictoire) et pas déjà attribué ce jour.
  const preferences = await prisma.preferenceAssiduite.findMany({
    where: { joursReposPlanifies: { has: jourSemaineUTC } },
  });
  let reposAttribues = 0;
  for (const pref of preferences) {
    const [seanceAujourdhui, dejaAttribue] = await Promise.all([
      prisma.seanceEntrainement.findFirst({
        where: { athleteId: pref.athleteId, date: { gte: debutJour } },
        select: { id: true },
      }),
      prisma.evenementXp.findFirst({
        where: { athleteId: pref.athleteId, type: "REPOS_PLANIFIE_RESPECTE", createdAt: { gte: debutJour } },
        select: { id: true },
      }),
    ]);
    if (!seanceAujourdhui && !dejaAttribue) {
      await attribuerXp(pref.athleteId, "REPOS_PLANIFIE_RESPECTE");
      reposAttribues++;
    }
  }

  // Dispatch des notifications push : préférence activée, fréquence
  // respectée pour aujourd'hui, un abonnement enregistré, aucune séance
  // aujourd'hui.
  const frequencesActives =
    JOURS_QUELQUES_FOIS_SEMAINE.includes(jourSemaineUTC)
      ? ["QUOTIDIEN", "QUELQUES_FOIS_SEMAINE"]
      : ["QUOTIDIEN"];
  const athletesANotifier = await prisma.athlete.findMany({
    where: {
      preferenceNotifications: { in: frequencesActives as ("QUOTIDIEN" | "QUELQUES_FOIS_SEMAINE")[] },
      abonnementsNotification: { some: {} },
      seancesEntrainement: { none: { date: { gte: debutJour } } },
    },
    select: { id: true, abonnementsNotification: true },
  });

  let notificationsEnvoyees = 0;
  for (const athlete of athletesANotifier) {
    for (const abonnement of athlete.abonnementsNotification) {
      const envoye = await envoyerNotificationPush(abonnement, {
        titre: "ScoutApp",
        corps: messagesFr.mascotte.rappelQuotidien,
      });
      if (envoye) notificationsEnvoyees++;
    }
  }

  const resume = {
    ligues,
    reposAttribues,
    notificationsEnvoyees,
    executeLe: maintenant.toISOString(),
  };
  console.log("[cron engagement] Passage terminé:", JSON.stringify(resume));

  return NextResponse.json(resume);
}
