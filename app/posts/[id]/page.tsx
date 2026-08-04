import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import {
  INCLUDE_POST_RELATIONS,
  auteurIdSession,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";
import ImageCarousel from "@/components/ImageCarousel";
import LikeButton from "@/components/LikeButton";
import SauvegarderBouton from "@/components/SauvegarderBouton";
import Avatar from "@/components/Avatar";
import CommentairesDetail from "@/components/CommentairesDetail";
import TexteEnrichi from "@/components/TexteEnrichi";
import RecapSeance from "@/components/RecapSeance";
import { hrefProfil } from "@/lib/routes";
import { ArrowLeft, Eye, ShieldCheck, UserRound } from "lucide-react";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: INCLUDE_POST_RELATIONS,
  });
  if (!post) notFound();

  // Enregistre une vue à l'ouverture de la vue détaillée (pas au simple
  // défilement dans le fil) ; contrainte d'unicité en base, un même compte
  // ne fait donc pas grimper le compteur en rouvrant plusieurs fois.
  await prisma.postVue.upsert({
    where: {
      postId_spectateurId_spectateurType: {
        postId: post.id,
        spectateurId: auteurIdSession(session),
        spectateurType: session.role,
      },
    },
    update: {},
    create: { postId: post.id, spectateurId: auteurIdSession(session), spectateurType: session.role },
  });

  const locale = await getLocale();
  const t = await getTranslations("fil");
  const tCommun = await getTranslations("commun");

  const commentaires = await prisma.postCommentaire.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs([post, ...commentaires]);
  const idsLikesParMoi = await idsPostsLikesParSession([post.id], session);
  const clesAbonnes = await clesAuteursAbonnesParSession([post], session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession([post.id], session);
  const fallbackNom = tCommun("utilisateur");
  const postFormate = formaterPost(post, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi);

  const commentairesFormates = commentaires.map((c) => ({
    id: c.id,
    auteurId: c.auteurId,
    auteurType: c.auteurType,
    auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`)?.nom ?? fallbackNom,
    contenu: c.contenu,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourFil")}
      </Link>

      <div className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <Link href={hrefProfil(postFormate.auteurType, postFormate.auteurId)}>
            <Avatar url={postFormate.auteurAvatarUrl} nom={postFormate.auteurNom} taille={44} />
          </Link>
          <div>
            <div className="flex items-center gap-1.5">
              <Link href={hrefProfil(postFormate.auteurType, postFormate.auteurId)} className="font-semibold hover:underline">
                {postFormate.auteurNom}
              </Link>
              <span className={`chip ${postFormate.auteurType === "ORGANISATEUR" ? "chip-gold" : "chip-neutral"}`}>
                {postFormate.auteurType === "ORGANISATEUR" ? (
                  <ShieldCheck size={11} />
                ) : (
                  <UserRound size={11} />
                )}
                {postFormate.auteurType === "ORGANISATEUR" ? t("organisateur") : t("athlete")}
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {postFormate.createdAt.toLocaleDateString(locale, {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">
          <TexteEnrichi texte={postFormate.contenu} />
        </p>

        {postFormate.seance && <RecapSeance exercices={postFormate.seance.exercices} />}

        <ImageCarousel images={postFormate.images} />

        <div className="flex items-center justify-between border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center gap-3">
            <LikeButton
              postId={postFormate.id}
              likeInitial={postFormate.likeParMoi}
              nombreInitial={postFormate.nombreLikes}
              size={20}
            />
            <SauvegarderBouton postId={postFormate.id} sauvegardeInitiale={postFormate.sauvegardeParMoi} />
          </div>
          <span className="flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
            <Eye size={16} />
            {t("nombreVues", { n: postFormate.nombreVues })}
          </span>
        </div>
      </div>

      <CommentairesDetail postId={postFormate.id} commentairesInitiaux={commentairesFormates} />
    </div>
  );
}
