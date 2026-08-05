import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configure = () => {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  configure = () => {};
};

type AbonnementPush = { id: string; endpoint: string; p256dh: string; auth: string };

// Envoie une notification à un abonnement donné. Un abonnement expiré/révoqué
// par le navigateur (410 Gone, ou 404 si le endpoint n'existe plus côté
// service push) est supprimé silencieusement plutôt que de faire échouer tout
// le passage du cron pour un seul destinataire obsolète.
export async function envoyerNotificationPush(
  abonnement: AbonnementPush,
  payload: { titre: string; corps: string }
): Promise<boolean> {
  configure();
  try {
    await webpush.sendNotification(
      {
        endpoint: abonnement.endpoint,
        keys: { p256dh: abonnement.p256dh, auth: abonnement.auth },
      },
      JSON.stringify(payload)
    );
    return true;
  } catch (e) {
    const statusCode = (e as { statusCode?: number }).statusCode;
    if (statusCode === 404 || statusCode === 410) {
      await prisma.abonnementNotification.delete({ where: { id: abonnement.id } }).catch(() => {});
    } else {
      console.error("[push] Échec d'envoi:", e instanceof Error ? e.message : e);
    }
    return false;
  }
}
