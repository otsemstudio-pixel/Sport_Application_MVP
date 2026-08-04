import { prisma } from "@/lib/prisma";

// Séquence #hashtag ou @mention : lettres/chiffres/underscore, sans espace.
const REGEX_HASHTAG = /#([a-zA-Z0-9_]+)/g;
const REGEX_MENTION = /@([a-zA-Z0-9_]+)/g;

export function extraireHashtags(texte: string): string[] {
  const trouves = texte.match(REGEX_HASHTAG) ?? [];
  const tags = trouves.map((h) => h.slice(1).toLowerCase());
  return [...new Set(tags)];
}

export function extraireNomsUtilisateurMentionnes(texte: string): string[] {
  const trouves = texte.match(REGEX_MENTION) ?? [];
  const noms = trouves.map((m) => m.slice(1).toLowerCase());
  return [...new Set(noms)];
}

// Analyse le texte d'un post ou d'un commentaire (l'un ou l'autre, jamais
// les deux — voir la contrainte CHECK sur Mention) et enregistre hashtags
// et mentions. Les hashtags ne sont liés qu'aux posts (pas de table de
// jointure côté commentaire dans le modèle demandé) ; les mentions
// s'appliquent aux deux. Une mention dont le nom d'utilisateur ne
// correspond à aucun compte est ignorée silencieusement (faute de frappe),
// sans jamais faire échouer la publication.
export async function traiterHashtagsEtMentions(
  texte: string,
  cible: { postId: string } | { commentaireId: string }
): Promise<void> {
  if ("postId" in cible) {
    const tags = extraireHashtags(texte);
    for (const tag of tags) {
      const hashtag = await prisma.hashtag.upsert({
        where: { tag },
        update: {},
        create: { tag },
      });
      await prisma.postHashtag.upsert({
        where: { postId_hashtagId: { postId: cible.postId, hashtagId: hashtag.id } },
        update: {},
        create: { postId: cible.postId, hashtagId: hashtag.id },
      });
    }
  }

  const nomsUtilisateur = extraireNomsUtilisateurMentionnes(texte);
  if (nomsUtilisateur.length === 0) return;

  const [athletes, organisateurs] = await Promise.all([
    prisma.athlete.findMany({ where: { nomUtilisateur: { in: nomsUtilisateur } }, select: { id: true, nomUtilisateur: true } }),
    prisma.organisateur.findMany({ where: { nomUtilisateur: { in: nomsUtilisateur } }, select: { id: true, nomUtilisateur: true } }),
  ]);

  const comptes: { id: string; type: "ATHLETE" | "ORGANISATEUR" }[] = [
    ...athletes.map((a) => ({ id: a.id, type: "ATHLETE" as const })),
    ...organisateurs.map((o) => ({ id: o.id, type: "ORGANISATEUR" as const })),
  ];

  for (const compte of comptes) {
    await prisma.mention.create({
      data: {
        ...("postId" in cible ? { postId: cible.postId } : { commentaireId: cible.commentaireId }),
        mentionneId: compte.id,
        mentionneType: compte.type,
      },
    });
  }
}

export type CompteMentionne = { id: string; type: "ATHLETE" | "ORGANISATEUR"; nom: string };

// Résout, pour l'affichage, les @nomUtilisateur présents dans une liste de
// textes vers les comptes réels correspondants — indépendant des lignes
// Mention déjà enregistrées, pour toujours refléter l'état actuel des
// comptes (même principe que resoudreNomsAuteurs dans lib/posts.ts, qui ne
// stocke pas non plus de nom figé au moment de la publication).
export async function resoudreMentionsPourTextes(textes: string[]): Promise<Map<string, CompteMentionne>> {
  const nomsUtilisateur = [...new Set(textes.flatMap(extraireNomsUtilisateurMentionnes))];
  if (nomsUtilisateur.length === 0) return new Map();

  const [athletes, organisateurs] = await Promise.all([
    prisma.athlete.findMany({ where: { nomUtilisateur: { in: nomsUtilisateur } }, select: { id: true, nom: true, nomUtilisateur: true } }),
    prisma.organisateur.findMany({ where: { nomUtilisateur: { in: nomsUtilisateur } }, select: { id: true, nom: true, nomUtilisateur: true } }),
  ]);

  const resolues = new Map<string, CompteMentionne>();
  for (const a of athletes) resolues.set(a.nomUtilisateur, { id: a.id, type: "ATHLETE", nom: a.nom });
  for (const o of organisateurs) resolues.set(o.nomUtilisateur, { id: o.id, type: "ORGANISATEUR", nom: o.nom });
  return resolues;
}
