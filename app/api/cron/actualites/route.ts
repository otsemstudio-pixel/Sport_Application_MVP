import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { recupererNewsData } from "@/lib/newsdata";
import { recupererRss } from "@/lib/rss";

const JOURS_RETENTION = 60;

// Déclenché par Vercel Cron (voir vercel.json) — jamais par une requête
// utilisateur. Vercel ajoute automatiquement l'en-tête
// `Authorization: Bearer $CRON_SECRET` sur les invocations planifiées quand
// CRON_SECRET est défini comme variable d'environnement du projet ; on
// vérifie ce secret pour qu'un tiers ne puisse pas déclencher le job (et
// consommer le quota NewsData.io) en appelant l'URL directement.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const autorisation = req.headers.get("authorization");
  if (!secret || autorisation !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  // NewsData.io d'abord (peut échouer/quota dépassé sans bloquer la suite),
  // puis RSS systématiquement — indépendant du résultat de l'étape précédente.
  const resultatNewsData = await recupererNewsData().catch((e) => {
    console.error("[cron actualites] Échec inattendu NewsData.io:", e instanceof Error ? e.message : e);
    return { ajoutes: 0, ignore: true, raison: "erreur_inattendue" as const };
  });

  const resultatRss = await recupererRss().catch((e) => {
    console.error("[cron actualites] Échec inattendu RSS:", e instanceof Error ? e.message : e);
    return { ajoutes: 0, parFlux: {} };
  });

  const seuilPurge = new Date();
  seuilPurge.setDate(seuilPurge.getDate() - JOURS_RETENTION);
  const { count: purgees } = await prisma.actualite.deleteMany({
    where: { publieLe: { lt: seuilPurge } },
  });

  const resume = {
    newsdata: resultatNewsData,
    rss: resultatRss,
    purgees,
    executeLe: new Date().toISOString(),
  };
  console.log("[cron actualites] Passage terminé:", JSON.stringify(resume));

  return NextResponse.json(resume);
}
