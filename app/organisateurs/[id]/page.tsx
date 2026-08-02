import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import {
  INCLUDE_POST_RELATIONS,
  auteurIdSession,
  clesAuteursAbonnesParSession,
  formaterPost,
  idsPostsLikesParSession,
  idsPostsSauvegardesParSession,
  resoudreNomsAuteurs,
} from "@/lib/posts";
import EnTeteProfilPublic from "@/components/EnTeteProfilPublic";
import PostCard from "@/components/PostCard";
import { ArrowLeft } from "lucide-react";

const NOMBRE_POSTS_AFFICHES = 15;

export default async function OrganisateurProfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;

  const organisateur = await prisma.organisateur.findUnique({ where: { id } });
  if (!organisateur) notFound();

  const t = await getTranslations("profilPublic");
  const tCommun = await getTranslations("commun");

  const [nombrePosts, abonnes, likes] = await Promise.all([
    prisma.post.count({ where: { auteurId: id, auteurType: "ORGANISATEUR" } }),
    prisma.abonnement.count({ where: { suiviId: id, suiviType: "ORGANISATEUR" } }),
    prisma.postLike.count({ where: { post: { auteurId: id, auteurType: "ORGANISATEUR" } } }),
  ]);

  const estMoi = session.role === "ORGANISATEUR" && session.organisateurId === id;
  let abonneInitial = false;
  if (!estMoi) {
    const existant = await prisma.abonnement.findUnique({
      where: {
        suiveurId_suiveurType_suiviId_suiviType: {
          suiveurId: auteurIdSession(session),
          suiveurType: session.role,
          suiviId: id,
          suiviType: "ORGANISATEUR",
        },
      },
    });
    abonneInitial = !!existant;
  }

  const posts = await prisma.post.findMany({
    where: { auteurId: id, auteurType: "ORGANISATEUR" },
    take: NOMBRE_POSTS_AFFICHES,
    orderBy: { createdAt: "desc" },
    include: INCLUDE_POST_RELATIONS,
  });
  const noms = await resoudreNomsAuteurs(posts);
  const idsLikesParMoi = await idsPostsLikesParSession(posts.map((p) => p.id), session);
  const clesAbonnes = await clesAuteursAbonnesParSession(posts, session);
  const idsSauvegardesParMoi = await idsPostsSauvegardesParSession(posts.map((p) => p.id), session);
  const fallbackNom = tCommun("utilisateur");
  const postsFormates = posts.map((p) => {
    const post = formaterPost(p, noms, idsLikesParMoi, session, fallbackNom, clesAbonnes, idsSauvegardesParMoi);
    return {
      ...post,
      createdAt: post.createdAt.toISOString(),
      seance: post.seance ? { ...post.seance, date: post.seance.date.toISOString() } : null,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retour")}
      </Link>

      <EnTeteProfilPublic
        nom={organisateur.nom}
        verifie={organisateur.verifie}
        bannerUrl={null}
        posts={nombrePosts}
        abonnes={abonnes}
        likes={likes}
        membreDepuis={organisateur.createdAt}
        estMoi={estMoi}
        type="organisateur"
        id={organisateur.id}
        abonneInitial={abonneInitial}
      />

      <div className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("publicationsTitre")}</h2>
        {postsFormates.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucunePublication")}
          </p>
        ) : (
          postsFormates.map((post) => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
