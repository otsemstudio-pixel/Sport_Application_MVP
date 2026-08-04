// Récupération depuis NewsData.io — appelée uniquement par le job cron
// (app/api/cron/actualites), jamais par une requête utilisateur en direct.
//
// Deux stratégies combinées à chaque passage :
// 1. Une requête structurée large (category=sports + country=<Afrique>),
//    plus efficace qu'une phrase précise pour ratisser large, non rattachée
//    à un sport unique.
// 2. Une rotation sur un sous-ensemble de sports (table Sport) — pas de
//    liste de mots-clés en dur : chaque sport devient un mot-clé, avec un
//    équivalent anglais quand le nom français ne serait pas reconnu tel
//    quel. Priorise les sports les moins récemment interrogés
//    (derniereRechercheActualite) pour couvrir tout le catalogue sur
//    plusieurs passages sans épuiser le quota gratuit en un seul.
import { prisma } from "@/lib/prisma";
import { categoriser, estPertinentSport, EQUIVALENT_ANGLAIS_SPORT } from "@/lib/actualites";

const URL_BASE = "https://newsdata.io/api/1/latest";
const SPORTS_PAR_PASSAGE = 4;
const PAYS_AFRIQUE = ["ng", "gh", "sn", "ci", "ke", "ma", "eg", "cm"];

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

type ReponseRequete = { ok: true; resultats: ResultatNewsData[] } | { ok: false; quotaDepasse: boolean; message: string };

async function requeteNewsData(params: URLSearchParams, apiKey: string): Promise<ReponseRequete> {
  params.set("apikey", apiKey);
  const res = await fetch(`${URL_BASE}?${params.toString()}`);

  if (res.status === 429) {
    return { ok: false, quotaDepasse: true, message: "HTTP 429" };
  }
  if (!res.ok) {
    return { ok: false, quotaDepasse: false, message: `HTTP ${res.status}` };
  }

  const corps = await res.json().catch(() => null);
  if (!corps || corps.status !== "success") {
    // NewsData.io renvoie parfois status="error" avec code 200 (ex. quota
    // épuisé sur certains plans).
    const message = corps?.results?.message ?? corps?.message ?? "réponse invalide";
    const quotaDepasse = typeof message === "string" && /quota|limit|rate/i.test(message);
    return { ok: false, quotaDepasse, message };
  }

  return { ok: true, resultats: Array.isArray(corps.results) ? corps.results : [] };
}

// Enregistre un résultat s'il est pertinent (sport) et nouveau (dédoublonné
// sur urlSource). Retourne true si effectivement ajouté.
async function enregistrerResultat(r: ResultatNewsData, sportId: string | null): Promise<boolean> {
  if (!r.link || !r.title) return false;
  const titre = r.title.trim();
  const resume = (r.description ?? r.content ?? "").trim().slice(0, 500) || titre;

  // Le paramètre `q` de NewsData.io n'est pas un filtre exact fiable en
  // toutes circonstances (constaté en test : une requête sportive a
  // remonté un article sans rapport) — filtre de sécurité systématique,
  // y compris sur la requête structurée category=sports.
  if (!estPertinentSport(titre, resume)) return false;

  try {
    const { count } = await prisma.actualite.updateMany({ where: { urlSource: r.link }, data: {} });
    if (count > 0) return false; // déjà connu, pas de doublon

    await prisma.actualite.create({
      data: {
        titre,
        resume,
        urlSource: r.link,
        imageUrl: r.image_url ?? null,
        sourceNom: r.source_name ? `NewsData.io — ${r.source_name}` : "NewsData.io",
        sourceType: "NEWSDATA",
        categorie: categoriser(titre, resume),
        sportId,
        publieLe: r.pubDate ? new Date(r.pubDate) : new Date(),
      },
    });
    return true;
  } catch (e) {
    // Contrainte unique sur urlSource : peut se déclencher en cas de course
    // entre deux requêtes qui remontent le même article dans le même
    // passage — pas une vraie erreur, on ignore.
    if (!(e instanceof Error && "code" in e && (e as { code?: string }).code === "P2002")) {
      console.error("[cron actualites] NewsData.io — échec insertion:", e instanceof Error ? e.message : e);
    }
    return false;
  }
}

export async function recupererNewsData(): Promise<{ ajoutes: number; ignore: boolean; raison?: string }> {
  const apiKey = process.env.NEWSDATA_API_KEY;
  if (!apiKey) {
    console.error("[cron actualites] NEWSDATA_API_KEY absente — étape NewsData.io ignorée.");
    return { ajoutes: 0, ignore: true, raison: "cle_api_absente" };
  }

  let ajoutes = 0;

  // 1. Requête structurée large — plus efficace qu'une phrase précise.
  const reponseLarge = await requeteNewsData(new URLSearchParams({ category: "sports", country: PAYS_AFRIQUE.join(",") }), apiKey);
  if (!reponseLarge.ok) {
    console.error("[cron actualites] NewsData.io — échec requête category+country:", reponseLarge.message);
    if (reponseLarge.quotaDepasse) {
      return { ajoutes, ignore: true, raison: "quota_depasse" };
    }
  } else {
    for (const r of reponseLarge.resultats) {
      if (await enregistrerResultat(r, null)) ajoutes++;
    }
  }

  // 2. Rotation par sport (le moins récemment interrogé en premier).
  const sports = await prisma.sport.findMany({
    orderBy: [{ derniereRechercheActualite: { sort: "asc", nulls: "first" } }, { nom: "asc" }],
    take: SPORTS_PAR_PASSAGE,
  });

  for (const sport of sports) {
    const requetesSport = [{ q: sport.nom, language: "fr" }];
    const equivalentAnglais = EQUIVALENT_ANGLAIS_SPORT[sport.nom];
    if (equivalentAnglais) requetesSport.push({ q: equivalentAnglais, language: "en" });

    let auMoinsUneTentative = false;
    let quotaDepasseSurCeSport = false;

    for (const { q, language } of requetesSport) {
      const reponse = await requeteNewsData(new URLSearchParams({ q, language }), apiKey);
      auMoinsUneTentative = true;
      if (!reponse.ok) {
        console.error(`[cron actualites] NewsData.io — échec pour "${sport.nom}" (${language}):`, reponse.message);
        if (reponse.quotaDepasse) {
          quotaDepasseSurCeSport = true;
          break;
        }
        continue;
      }
      for (const r of reponse.resultats) {
        if (await enregistrerResultat(r, sport.id)) ajoutes++;
      }
    }

    // Le quota étant partagé pour toute la journée, un quota dépassé sur un
    // sport l'est pour tous les suivants — inutile de continuer la
    // rotation sur ce passage. Ce sport a bien été tenté : on avance quand
    // même sa date pour ne pas le re-prioriser immédiatement au prochain
    // passage (qui butera probablement sur le même quota).
    if (auMoinsUneTentative) {
      await prisma.sport.update({ where: { id: sport.id }, data: { derniereRechercheActualite: new Date() } });
    }
    if (quotaDepasseSurCeSport) {
      return { ajoutes, ignore: true, raison: "quota_depasse" };
    }
  }

  return { ajoutes, ignore: false };
}
