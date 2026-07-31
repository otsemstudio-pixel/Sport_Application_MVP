import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formaterPost, idsPostsLikesParSession, resoudreNomsAuteurs } from "@/lib/posts";
import ImageCarousel from "@/components/ImageCarousel";
import LikeButton from "@/components/LikeButton";
import CommentairesDetail from "@/components/CommentairesDetail";
import { ArrowLeft, ShieldCheck, UserRound } from "lucide-react";

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
    include: {
      images: { select: { url: true, ordre: true } },
      _count: { select: { likes: true, commentaires: true } },
    },
  });
  if (!post) notFound();

  const commentaires = await prisma.postCommentaire.findMany({
    where: { postId: id },
    orderBy: { createdAt: "asc" },
  });

  const noms = await resoudreNomsAuteurs([post, ...commentaires]);
  const idsLikesParMoi = await idsPostsLikesParSession([post.id], session);
  const postFormate = formaterPost(post, noms, idsLikesParMoi, session);

  const commentairesFormates = commentaires.map((c) => ({
    id: c.id,
    auteurType: c.auteurType,
    auteurNom: noms.get(`${c.auteurType}:${c.auteurId}`) ?? "Utilisateur",
    contenu: c.contenu,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        Retour au fil
      </Link>

      <div className="card flex flex-col gap-4 p-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-full text-base font-bold"
            style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
          >
            {postFormate.auteurNom.trim()[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold">{postFormate.auteurNom}</span>
              <span className={`chip ${postFormate.auteurType === "ORGANISATEUR" ? "chip-gold" : "chip-neutral"}`}>
                {postFormate.auteurType === "ORGANISATEUR" ? (
                  <ShieldCheck size={11} />
                ) : (
                  <UserRound size={11} />
                )}
                {postFormate.auteurType === "ORGANISATEUR" ? "Organisateur" : "Athlète"}
              </span>
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {postFormate.createdAt.toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        <p className="whitespace-pre-wrap text-[15px] leading-relaxed">{postFormate.contenu}</p>

        <ImageCarousel images={postFormate.images} />

        <div className="border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <LikeButton
            postId={postFormate.id}
            likeInitial={postFormate.likeParMoi}
            nombreInitial={postFormate.nombreLikes}
            size={20}
          />
        </div>
      </div>

      <CommentairesDetail postId={postFormate.id} commentairesInitiaux={commentairesFormates} />
    </div>
  );
}
