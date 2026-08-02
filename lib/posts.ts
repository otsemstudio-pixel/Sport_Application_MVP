import { prisma } from "@/lib/prisma";
import type { SessionInfo } from "@/lib/auth";

// Relations communes à charger pour afficher un post (liste ou détail),
// y compris l'éventuel récapitulatif de séance partagée.
export const INCLUDE_POST_RELATIONS = {
  images: { select: { url: true, ordre: true } },
  _count: { select: { likes: true, commentaires: true, vues: true } },
  seanceEntrainement: {
    include: {
      exercicesRealises: {
        include: { exercice: true, series: { orderBy: { numeroSerie: "asc" } } },
      },
    },
  },
} as const;

type Auteur = { auteurId: string; auteurType: "ATHLETE" | "ORGANISATEUR" };

type InfosAuteur = { nom: string; avatarUrl: string | null };

// Organisateur n'a pas de champ avatarUrl (photo de profil réservée aux
// athlètes pour l'instant) : ses entrées ont toujours avatarUrl=null.
export async function resoudreNomsAuteurs(entites: Auteur[]) {
  const athleteIds = entites.filter((e) => e.auteurType === "ATHLETE").map((e) => e.auteurId);
  const organisateurIds = entites
    .filter((e) => e.auteurType === "ORGANISATEUR")
    .map((e) => e.auteurId);

  const [athletes, organisateurs] = await Promise.all([
    athleteIds.length
      ? prisma.athlete.findMany({
          where: { id: { in: athleteIds } },
          select: { id: true, nom: true, avatarUrl: true },
        })
      : Promise.resolve([]),
    organisateurIds.length
      ? prisma.organisateur.findMany({
          where: { id: { in: organisateurIds } },
          select: { id: true, nom: true },
        })
      : Promise.resolve([]),
  ]);

  const noms = new Map<string, InfosAuteur>();
  athletes.forEach((a) => noms.set(`ATHLETE:${a.id}`, { nom: a.nom, avatarUrl: a.avatarUrl }));
  organisateurs.forEach((o) => noms.set(`ORGANISATEUR:${o.id}`, { nom: o.nom, avatarUrl: null }));
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

export async function idsPostsSauvegardesParSession(postIds: string[], session: SessionInfo) {
  const mesSauvegardes = await prisma.postSauvegarde.findMany({
    where: {
      postId: { in: postIds },
      auteurId: auteurIdSession(session),
      auteurType: session.role,
    },
    select: { postId: true },
  });
  return new Set(mesSauvegardes.map((s) => s.postId));
}

// Clés (`TYPE:id`) des auteurs, parmi ceux passés, auxquels la session est
// abonnée — une seule requête pour tout un lot de posts plutôt qu'un appel
// par auteur.
export async function clesAuteursAbonnesParSession(auteurs: Auteur[], session: SessionInfo) {
  const distinctsAuteurs = [...new Map(auteurs.map((a) => [`${a.auteurType}:${a.auteurId}`, a])).values()];
  if (distinctsAuteurs.length === 0) return new Set<string>();
  const mesAbonnements = await prisma.abonnement.findMany({
    where: {
      suiveurId: auteurIdSession(session),
      suiveurType: session.role,
      OR: distinctsAuteurs.map((a) => ({ suiviId: a.auteurId, suiviType: a.auteurType })),
    },
    select: { suiviId: true, suiviType: true },
  });
  return new Set(mesAbonnements.map((a) => `${a.suiviType}:${a.suiviId}`));
}

type SeanceRecapSource = {
  id: string;
  date: Date;
  exercicesRealises: {
    id: string;
    exercice: { nom: string; uniteMesure: string };
    series: {
      id: string;
      numeroSerie: number;
      repetitions: number | null;
      poidsKg: number | null;
      dureeSecondes: number | null;
      distanceMetres: number | null;
    }[];
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
    _count: { likes: number; commentaires: number; vues: number };
    seanceEntrainement?: SeanceRecapSource;
  },
  noms: Map<string, InfosAuteur>,
  idsLikesParMoi: Set<string>,
  session: SessionInfo,
  fallbackNom = "Utilisateur",
  clesAuteursAbonnes: Set<string> = new Set(),
  idsSauvegardesParMoi: Set<string> = new Set()
) {
  const infosAuteur = noms.get(`${post.auteurType}:${post.auteurId}`);
  return {
    id: post.id,
    auteurId: post.auteurId,
    auteurType: post.auteurType,
    auteurNom: infosAuteur?.nom ?? fallbackNom,
    auteurAvatarUrl: infosAuteur?.avatarUrl ?? null,
    contenu: post.contenu,
    images: [...post.images].sort((a, b) => a.ordre - b.ordre).map((i) => i.url),
    createdAt: post.createdAt,
    nombreLikes: post._count.likes,
    nombreCommentaires: post._count.commentaires,
    nombreVues: post._count.vues,
    likeParMoi: idsLikesParMoi.has(post.id),
    sauvegardeParMoi: idsSauvegardesParMoi.has(post.id),
    abonneParMoi: clesAuteursAbonnes.has(`${post.auteurType}:${post.auteurId}`),
    auteurCestMoi: `${post.auteurType}:${post.auteurId}` === cleAuteurSession(session),
    seance: post.seanceEntrainement
      ? {
          id: post.seanceEntrainement.id,
          date: post.seanceEntrainement.date,
          exercices: post.seanceEntrainement.exercicesRealises.map((er) => ({
            id: er.id,
            nom: er.exercice.nom,
            uniteMesure: er.exercice.uniteMesure,
            series: er.series.map((s) => ({
              id: s.id,
              numeroSerie: s.numeroSerie,
              repetitions: s.repetitions,
              poidsKg: s.poidsKg,
              dureeSecondes: s.dureeSecondes,
              distanceMetres: s.distanceMetres,
            })),
          })),
        }
      : null,
  };
}
