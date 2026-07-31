import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { auteurIdSession } from "@/lib/posts";
import BandeauStatistiquesProfil from "@/components/BandeauStatistiquesProfil";
import AbonnementBouton from "@/components/AbonnementBouton";
import { ArrowLeft, Activity, MapPin } from "lucide-react";

export default async function AthleteProfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/connexion");
  const { id } = await params;

  const athlete = await prisma.athlete.findUnique({
    where: { id },
    include: { sportPrincipal: true },
  });
  if (!athlete) notFound();

  const locale = await getLocale();
  const t = await getTranslations("profilPublic");

  const [abonnes, abonnements, likes, commentaires, vues] = await Promise.all([
    prisma.abonnement.count({ where: { suiviId: id, suiviType: "ATHLETE" } }),
    prisma.abonnement.count({ where: { suiveurId: id, suiveurType: "ATHLETE" } }),
    prisma.postLike.count({ where: { post: { auteurId: id, auteurType: "ATHLETE" } } }),
    prisma.postCommentaire.count({ where: { post: { auteurId: id, auteurType: "ATHLETE" } } }),
    prisma.postVue.count({ where: { post: { auteurId: id, auteurType: "ATHLETE" } } }),
  ]);

  const estMoi = session.role === "ATHLETE" && session.athleteId === id;
  let abonneInitial = false;
  if (!estMoi) {
    const existant = await prisma.abonnement.findUnique({
      where: {
        suiveurId_suiveurType_suiviId_suiviType: {
          suiveurId: auteurIdSession(session),
          suiveurType: session.role,
          suiviId: id,
          suiviType: "ATHLETE",
        },
      },
    });
    abonneInitial = !!existant;
  }

  const initiale = athlete.nom.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex flex-col gap-6">
      <Link href="/fil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retour")}
      </Link>

      <div className="card flex items-center gap-4 p-6">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-2xl font-bold"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          {initiale}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold">{athlete.nom}</h1>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" style={{ color: "var(--muted)" }}>
            <span className="flex items-center gap-1">
              <Activity size={13} />
              {athlete.sportPrincipal.nom}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={13} />
              {athlete.ville}
            </span>
          </p>
        </div>
      </div>

      <BandeauStatistiquesProfil
        abonnes={abonnes}
        abonnements={abonnements}
        likes={likes}
        commentaires={commentaires}
        vues={vues}
        locale={locale}
      />

      {!estMoi && <AbonnementBouton type="athlete" id={athlete.id} abonneInitial={abonneInitial} />}
    </div>
  );
}
