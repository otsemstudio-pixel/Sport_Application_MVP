// Récupération depuis NewsData.io — appelée uniquement par le job cron
// (app/api/cron/actualites), jamais par une requête utilisateur en direct.
import { prisma } from "@/lib/prisma";
import { MOTS_CLES_RECHERCHE, categoriser, estPertinentSport } from "@/lib/actualites";

const URL_BASE = "https://newsdata.io/api/1/latest";

type ResultatNewsData = {
  article_id?: string;
  title?: string;
  description?: string;
  content?: string;
  link?: string;
  pubDate?: string;
  image_url?: string;
  source_id?: string;
  source_name?: string;
};

async function requeteMotCle(motCle: string, apiKey: string): Promise<ResultatNewsData[]> {
  const url = `${URL_BASE}?apikey=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(motCle)}&language=fr`;
  const res = await fetch(url);

  if (res.status === 429) {
    throw Object.assign(new Error("NewsData.io : quota dépassé (429)"), { quotaDepasse: true });
  }
  if (!res.ok) {
    throw new Error(`NewsData.io : HTTP ${res.status} pour "${motCle}"`);
  }

  const corps = await res.json().catch(() => null);
  if (!corps || corps.status !== "success") {
    // NewsData.io renvoie parfois status="error" avec code 200 (ex. quota
    // épuisé sur certains plans) — traité comme un échec non bloquant.
    const message = corps?.results?.message ?? corps?.message ?? "réponse invalide";
    throw Object.assign(new Error(`NewsData.io : ${message}`), {
      quotaDepasse: typeof message === "string" && /quota|limit|rate/i.test(message),
    });
  }

  return Array.isArray(corps.results) ? corps.results : [];
}

// Interroge NewsData.io avec chaque mot-clé de la liste et enregistre les
// résultats. Ne lance jamais d'exception vers l'appelant : toute erreur
// (quota dépassé, clé absente/invalide, panne réseau) est loguée et fait
// simplement s'arrêter cette étape, sans jamais bloquer la récupération RSS
// qui doit s'exécuter indépendamment.
export async function recupererNewsData(): Promise<{ ajoutes: number; ignore: boolean; raison?: string }> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("[cron actualites] NEWSDATA_API_KEY absente — étape NewsData.io ignorée.");
    return { ajoutes: 0, ignore: true, raison: "cle_api_absente" };
  }

  let ajoutes = 0;
  for (const motCle of MOTS_CLES_RECHERCHE) {
    let resultats: ResultatNewsData[];
    try {
      resultats = await requeteMotCle(motCle, apiKey);
    } catch (e) {
      const quotaDepasse = e instanceof Error && "quotaDepasse" in e && (e as { quotaDepasse?: boolean }).quotaDepasse;
      console.error(`[cron actualites] NewsData.io — échec pour "${motCle}":`, e instanceof Error ? e.message : e);
      if (quotaDepasse) {
        // Quota épuisé : inutile d'essayer les mots-clés suivants sur ce
        // passage, mais on continue le job (RSS tourne quoi qu'il arrive).
        return { ajoutes, ignore: true, raison: "quota_depasse" };
      }
      continue;
    }

    for (const r of resultats) {
      if (!r.link || !r.title) continue;
      const titre = r.title.trim();
      const resume = (r.description ?? r.content ?? "").trim().slice(0, 500) || titre;
      // Le paramètre `q` de NewsData.io n'est pas un filtre exact fiable en
      // toutes circonstances (constaté en test : une requête sportive a
      // remonté un article sur un boycott artistique, sans rapport) — même
      // filtre de pertinence que pour le flux RSS généraliste Africanews.
      if (!estPertinentSport(titre, resume)) continue;
      try {
        const { count } = await prisma.actualite.updateMany({
          where: { urlSource: r.link },
          data: {},
        });
        if (count > 0) continue; // déjà connu, pas de doublon
        await prisma.actualite.create({
          data: {
            titre,
            resume,
            urlSource: r.link,
            imageUrl: r.image_url ?? null,
            sourceNom: r.source_name ? `NewsData.io — ${r.source_name}` : "NewsData.io",
            sourceType: "NEWSDATA",
            categorie: categoriser(titre, resume),
            publieLe: r.pubDate ? new Date(r.pubDate) : new Date(),
          },
        });
        ajoutes++;
      } catch (e) {
        // Contrainte unique sur urlSource : peut se déclencher en cas de
        // course entre deux mots-clés qui remontent le même article dans la
        // même exécution — pas une vraie erreur, on ignore et on continue.
        if (!(e instanceof Error && "code" in e && (e as { code?: string }).code === "P2002")) {
          console.error("[cron actualites] NewsData.io — échec insertion:", e instanceof Error ? e.message : e);
        }
      }
    }
  }

  return { ajoutes, ignore: false };
}
