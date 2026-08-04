// Récupération depuis des flux RSS — appelée uniquement par le job cron
// (app/api/cron/actualites), jamais par une requête utilisateur en direct.
//
// Flux retenus après vérification manuelle (voir échanges de validation) :
// aucun flux RSS actif n'a été trouvé pour la CAF, la BAL, BBC Sport Africa,
// SuperSport, Kickoff ou Goal.com (404 ou page HTML sans flux). Les deux
// flux ci-dessous sont réellement actifs à ce jour :
// - Africanews : généraliste (pas de flux "sport" dédié) → filtré par
//   mots-clés (estPertinentSport) pour ne garder que le contenu sportif.
// - RFI Sports : déjà un flux sport (généraliste, pas exclusivement Afrique,
//   mais RFI couvre fortement l'actualité africaine) → pas de filtre.
import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { categoriser, estPertinentSport } from "@/lib/actualites";

type FluxRss = { nom: string; url: string; filtrerPertinenceSport: boolean };

export const FLUX_RSS: FluxRss[] = [
  { nom: "Africanews", url: "https://www.africanews.com/feed/", filtrerPertinenceSport: true },
  { nom: "RFI Sports", url: "https://www.rfi.fr/fr/sports/rss", filtrerPertinenceSport: false },
];

const parser = new Parser({
  customFields: {
    item: [["media:thumbnail", "mediaThumbnail"]],
  },
});

function extraireImage(item: Parser.Item & { mediaThumbnail?: { $?: { url?: string } } }): string | null {
  if (item.enclosure?.url) return item.enclosure.url;
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  return null;
}

// Récupère chaque flux de la liste indépendamment : l'échec d'un flux
// (réseau, format invalide) n'empêche pas les autres de s'exécuter, et cette
// étape tourne systématiquement que NewsData.io ait réussi, échoué ou soit
// en quota dépassé.
export async function recupererRss(): Promise<{ ajoutes: number; parFlux: Record<string, number> }> {
  let ajoutes = 0;
  const parFlux: Record<string, number> = {};

  for (const flux of FLUX_RSS) {
    parFlux[flux.nom] = 0;
    let items: Parser.Item[];
    try {
      const feed = await parser.parseURL(flux.url);
      items = feed.items ?? [];
    } catch (e) {
      console.error(`[cron actualites] RSS — échec de récupération de "${flux.nom}":`, e instanceof Error ? e.message : e);
      continue;
    }

    for (const item of items) {
      if (!item.link || !item.title) continue;
      const titre = item.title.trim();
      const resume = (item.contentSnippet ?? item.content ?? "").trim().slice(0, 500) || titre;

      if (flux.filtrerPertinenceSport && !estPertinentSport(titre, resume)) continue;

      try {
        const { count } = await prisma.actualite.updateMany({ where: { urlSource: item.link }, data: {} });
        if (count > 0) continue;
        await prisma.actualite.create({
          data: {
            titre,
            resume,
            urlSource: item.link,
            imageUrl: extraireImage(item),
            sourceNom: `RSS — ${flux.nom}`,
            sourceType: "RSS",
            categorie: categoriser(titre, resume),
            publieLe: item.isoDate ? new Date(item.isoDate) : item.pubDate ? new Date(item.pubDate) : new Date(),
          },
        });
        ajoutes++;
        parFlux[flux.nom]++;
      } catch (e) {
        if (!(e instanceof Error && "code" in e && (e as { code?: string }).code === "P2002")) {
          console.error(`[cron actualites] RSS — échec insertion depuis "${flux.nom}":`, e instanceof Error ? e.message : e);
        }
      }
    }
  }

  return { ajoutes, parFlux };
}
