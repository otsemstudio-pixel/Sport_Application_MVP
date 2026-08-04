// Logique partagée entre les deux récupérateurs (NewsData.io et RSS) : le
// job cron est la seule source d'écriture de la table Actualite, jamais une
// requête utilisateur en direct (voir app/api/cron/actualites/route.ts).
import type { Actualite, CategorieActualite } from "@/app/generated/prisma/client";

// Équivalent anglais du nom du sport, uniquement quand le nom français ne
// serait pas reconnu tel quel dans un article anglophone (ex. "athlétisme"
// n'a aucune chance de matcher "athletics") — les sports déjà proches ou
// identiques en anglais (Football, Basketball, Handball, Volleyball, Judo,
// Taekwondo) n'ont pas besoin d'entrée ici, une seule requête FR suffit.
export const EQUIVALENT_ANGLAIS_SPORT: Record<string, string> = {
  "Athlétisme (sprint/sauts)": "athletics",
  "Athlétisme (fond/demi-fond)": "athletics distance running",
  "Rugby à 7": "rugby sevens",
  "Cyclisme sur piste": "track cycling",
  "Cyclisme sur route": "road cycling",
  Natation: "swimming",
  "Lutte sénégalaise": "senegalese wrestling",
  "Dambe (boxe traditionnelle nigériane)": "dambe boxing",
  Boxe: "boxing",
};

// Pas de "can"/"bal" isolés : même avec une limite de mot, ce sont des mots
// anglais/français ordinaires ("Africa CAN achieve...", "un bal populaire")
// bien plus fréquents que l'acronyme sportif visé — seule la forme longue
// non ambiguë est retenue pour ces deux-là.
const MOTS_SPORT = [
  "football",
  "basketball",
  "basket",
  "athlétisme",
  "athletisme",
  "lutte",
  "boxe",
  "judo",
  "taekwondo",
  "rugby",
  "volley",
  "natation",
  "cyclisme",
  "tournoi",
  "championnat",
  "sélection",
  "selection",
  "olympique",
  "olympics",
  "coupe d'afrique",
  "africa cup of nations",
  "basketball africa league",
  "caf",
  "bourse sportive",
  "sports scholarship",
  "scouting",
  "athlète",
  "athlete",
  "sportif",
  "sportive",
  "match",
  "compétition",
  "competition",
  "équipe nationale",
  "equipe nationale",
  "national team",
];

const MOTS_BOURSE_OPPORTUNITE = ["bourse", "scholarship", "recrutement", "opportunité", "opportunite", "détection", "detection"];
const MOTS_SELECTION_NATIONALE = ["sélection", "selection", "convoqu", "équipe nationale", "equipe nationale", "call-up", "national team"];
const MOTS_RESULTAT_TOURNOI = ["résultat", "resultat", "score", "victoire", "finale", "tournoi", "championnat", "défaite", "defaite", "qualifi"];

function normaliser(texte: string) {
  return texte
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

function echapperRegex(texte: string) {
  return texte.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Recherche par mot/phrase entier (limites \b), pas par simple sous-chaîne :
// un `.includes("can ")` naïf matchait par exemple "afriCAN cyberthreat"
// (frontière entre "african" et l'espace suivant) — bug réel trouvé en
// testant contre le flux Africanews réel.
function contientMot(texte: string, mot: string): boolean {
  return new RegExp(`\\b${echapperRegex(normaliser(mot))}\\b`, "i").test(texte);
}

// Filtre de pertinence pour un flux généraliste (Africanews) : rejette tout
// item qui ne mentionne aucun mot-clé sportif — sans ça, le fil serait
// pollué de politique/économie.
export function estPertinentSport(titre: string, resume: string): boolean {
  const texte = normaliser(`${titre} ${resume}`);
  return MOTS_SPORT.some((mot) => contientMot(texte, mot));
}

// Catégorisation heuristique par mots-clés — aucune des deux sources ne
// fournit une catégorie qui corresponde à notre taxonomie, donc appliquée
// uniformément aux résultats NewsData.io et RSS.
export function categoriser(titre: string, resume: string): CategorieActualite {
  const texte = normaliser(`${titre} ${resume}`);
  if (MOTS_BOURSE_OPPORTUNITE.some((m) => contientMot(texte, m))) return "BOURSE_OPPORTUNITE";
  if (MOTS_SELECTION_NATIONALE.some((m) => contientMot(texte, m))) return "SELECTION_NATIONALE";
  if (MOTS_RESULTAT_TOURNOI.some((m) => contientMot(texte, m))) return "RESULTAT_TOURNOI";
  return "GENERAL";
}

export function formaterActualite(a: Actualite) {
  return {
    id: a.id,
    titre: a.titre,
    resume: a.resume,
    urlSource: a.urlSource,
    imageUrl: a.imageUrl,
    sourceNom: a.sourceNom,
    sourceType: a.sourceType,
    categorie: a.categorie,
    sportId: a.sportId,
    publieLe: a.publieLe,
  };
}
