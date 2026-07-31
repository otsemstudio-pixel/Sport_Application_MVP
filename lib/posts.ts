import { prisma } from "@/lib/prisma";
import type { SessionInfo } from "@/lib/auth";

// Relations communes à charger pour afficher un post (liste ou détail),
// y compris l'éventuel récapitulatif de séance partagée.
export const INCLUDE_POST_RELATIONS = {
  images: { select: { url: true, ordre: true } },
  _count: { select: { likes: true, commentaires: true } },
  seanceEntrainement: {
    include: { exercicesRealises: { include: { exercice: true } } },
  },
} as const;

type Auteur = { auteurId: string; auteurType: "ATHLETE" | "ORGANISATEUR" };

export async function resoudreNomsAuteurs(entites: Auteur[]) {
  const athleteIds = entites.filter((e) => e.auteurType === "ATHLETE").map((e) => e.auteurId);
  const organisateurIds = entites
    .filter((e) => e.auteurType === "ORGANISATEUR")
    .map((e) => e.auteurId);

  const [athletes, organisateurs] = await Promise.all([
    athleteIds.length
      ? prisma.athlete.findMany({
          where: { id: { in: athleteIds } },
          select: { id: true, nom: true },
        })
      : Promise.resolve([]),
    organisateurIds.length
      ? prisma.organisateur.findMany({
          where: { id: { in: organisateurIds } },
          select: { id: true, nom: true },
        })
      : Promise.resolve([]),
  ]);

  const noms = new Map<string, string>();
  athletes.forEach((a) => noms.set(`ATHLETE:${a.id}`, a.nom));
  organisateurs.forEach((o) => noms.set(`ORGANISATEUR:${o.id}`, o.nom));
  return noms;
}

export function cleAuteurSession(session: SessionInfo) {
  return session.role === "ATHLETE" ? `ATHLETE:${session.athleteId}` : `ORGANISATEUR:${session.organisateurId}`;
}

export function auteurIdSession(session: SessionInfo) {
  return session.role === "ATHLETE" ? session.athleteId : session.organisateurId;
}

export async function idsPostsLikesParSession(postIds: string[], session: SessionInfo) {
  const mesLikes = await prisma.postLike.findMany({
    where: {
      postId: { in: postIds },
      auteurId: auteurIdSession(session),
      auteurType: session.role,
    },
    select: { postId: true },
  });
  return new Set(mesLikes.map((l) => l.postId));
}

type SeanceRecapSource = {
  id: string;
  date: Date;
  exercicesRealises: {
    id: string;
    valeur: number;
    series: number | null;
    exercice: { nom: string; uniteMesure: string };
  }[];
} | null;

export function formaterPost(
  post: {
    id: string;
    auteurId: string;
    auteurType: "ATHLETE" | "ORGANISATEUR";
    contenu: string;
    createdAt: Date;
    images: { url: string; ordre: number }[];
    _count: { likes: number; commentaires: number };
    seanceEntrainement?: SeanceRecapSource;
  },
  noms: Map<string, string>,
  idsLikesParMoi: Set<string>,
  session: SessionInfo,
  fallbackNom = "Utilisateur"
) {
  return {
    id: post.id,
    auteurId: post.auteurId,
    auteurType: post.auteurType,
    auteurNom: noms.get(`${post.auteurType}:${post.auteurId}`) ?? fallbackNom,
    contenu: post.contenu,
    images: [...post.images].sort((a, b) => a.ordre - b.ordre).map((i) => i.url),
    createdAt: post.createdAt,
    nombreLikes: post._count.likes,
    nombreCommentaires: post._count.commentaires,
    likeParMoi: idsLikesParMoi.has(post.id),
    auteurCestMoi: `${post.auteurType}:${post.auteurId}` === cleAuteurSession(session),
    seance: post.seanceEntrainement
      ? {
          id: post.seanceEntrainement.id,
          date: post.seanceEntrainement.date,
          exercices: post.seanceEntrainement.exercicesRealises.map((er) => ({
            id: er.id,
            nom: er.exercice.nom,
            uniteMesure: er.exercice.uniteMesure,
            valeur: er.valeur,
            series: er.series,
          })),
        }
      : null,
  };
}
