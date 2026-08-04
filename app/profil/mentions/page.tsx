import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import MentionsFeed from "@/components/MentionsFeed";
import {
  INCLUDE_POST_RELATIONS,
  auteurIdSession,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";
import { ArrowLeft } from "lucide-react";

const PAGE_SIZE = 15;

// Accessible aux athlètes ET aux organisateurs (une mention peut viser
// n'importe lequel des deux) — pas de redirection par rôle contrairement à
// /profil, qui reste réservé aux athlètes.
export default async function MentionsPage() {
  const session = await getSession();
  if (!session) redirect("/connexion");

  const t = await getTranslations("mentions");
  const tCommun = await getTranslations("commun");
  const retour = session.role === "ATHLETE" ? "/profil" : "/organisateur";

  const mentions = await prisma.mention.findMany({
    take: PAGE_SIZE,
    where: { mentionneId: auteurIdSession(session), mentionneType: session.role },
    orderBy: { createdAt: "desc" },
  });

  const idsPosts = mentions.filter((m) => m.postId).map((m) => m.postId as string);
  const idsCommentaires = mentions.filter((m) => m.commentaireId).map((m) => m.commentaireId as string);

  const [posts, commentaires] = await Promise.all([
    idsPosts.length
      ? prisma.post.findMany({ where: { id: { in: idsPosts } }, include: INCLUDE_POST_RELATIONS })
      : Promise.resolve([]),
    idsCommentaires.length
      ? prisma.postCommentaire.findMany({ where: { id: { in: idsCommentaires } }, include: { post: { select: { id: true } } } })
      : Promise.resolve([]),
  ]);

  const noms = await resoudreNomsAuteurs([...posts, ...commentaires]);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);
  const clesAbonnes = await clesAuteursAbonnesParSession(posts, session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession(posts.map((p) => p.id), session);
  const fallbackNom = tCommun("utilisateur");

  const postsParId = new Map(posts.map((p) => [p.id, p]));
  const commentairesParId = new Map(commentaires.map((c) => [c.id, c]));

  const items = mentions
    .map((m) => {
      if (m.postId) {
        const post = postsParId.get(m.postId);
        if (!post) return null;
        const f = formaterPost(post, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi);
        return {
          type: "post" as const,
          post: { ...f, createdAt: f.createdAt.toISOString(), seance: f.seance ? { ...f.seance, date: f.seance.date.toISOString() } : null },
        };
      }
      if (m.commentaireId) {
        const c = commentairesParId.get(m.commentaireId);
        if (!c) return null;
        return {
          type: "commentaire" as const,
          commentaire: {
            id: c.id,
            postId: c.post.id,
            auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
            contenu: c.contenu,
            createdAt: c.createdAt.toISOString(),
          },
        };
      }
      return null;
    })
    .filter((i) => i !== null);

  return (
    <div className="flex flex-col gap-6">
      <Link href={retour} className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retour")}
      </Link>

      <h1 className="text-2xl font-bold">{t("titre")}</h1>

      <MentionsFeed itemsInitiaux={items} curseurInitial={mentions.length === PAGE_SIZE ? mentions[mentions.length - 1].id : null} />
    </div>
  );
}
