import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import { auteurIdSession } from "@/lib/posts";
import BandeauStatistiquesProfil from "@/components/BandeauStatistiquesProfil";
import AbonnementBouton from "@/components/AbonnementBouton";
import { ArrowLeft, ShieldCheck } from "lucide-react";

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

  const locale = await getLocale();
  const t = await getTranslations("profilPublic");
  const tOrganisateur = await getTranslations("organisateur");

  const [abonnes, abonnements, likes, commentaires, vues] = await Promise.all([
    prisma.abonnement.count({ where: { suiviId: id, suiviType: "ORGANISATEUR" } }),
    prisma.abonnement.count({ where: { suiveurId: id, suiveurType: "ORGANISATEUR" } }),
    prisma.postLike.count({ where: { post: { auteurId: id, auteurType: "ORGANISATEUR" } } }),
    prisma.postCommentaire.count({ where: { post: { auteurId: id, auteurType: "ORGANISATEUR" } } }),
    prisma.postVue.count({ where: { post: { auteurId: id, auteurType: "ORGANISATEUR" } } }),
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

  const initiale = organisateur.nom.trim()[0]?.toUpperCase() ?? "?";

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
          <h1 className="truncate text-xl font-bold">{organisateur.nom}</h1>
          {organisateur.verifie && (
            <span className="chip chip-success mt-1">
              <ShieldCheck size={13} />
              {tOrganisateur("verifie")}
            </span>
          )}
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

      {!estMoi && <AbonnementBouton type="organisateur" id={organisateur.id} abonneInitial={abonneInitial} />}
    </div>
  );
}
