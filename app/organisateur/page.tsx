import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, getTranslations } from "next-intl/server";
import CreateEventForm from "@/components/CreateEventForm";
import BandeauStatistiquesProfil from "@/components/BandeauStatistiquesProfil";
import { Calendar, CalendarDays, ChevronRight, MapPin, ShieldCheck, Users } from "lucide-react";

export default async function OrganisateurPage() {
  const session = await getSession();
  if (!session || session.role !== "ORGANISATEUR") redirect("/connexion");

  const [organisateur, evenements, abonnes, abonnements, likes, commentaires, vues] = await Promise.all([
    prisma.organisateur.findUnique({ where: { id: session.organisateurId } }),
    prisma.evenement.findMany({
      where: { organisateurId: session.organisateurId },
      include: { _count: { select: { inscriptions: true } } },
      orderBy: { date: "asc" },
    }),
    prisma.abonnement.count({ where: { suiviId: session.organisateurId, suiviType: "ORGANISATEUR" } }),
    prisma.abonnement.count({ where: { suiveurId: session.organisateurId, suiveurType: "ORGANISATEUR" } }),
    prisma.postLike.count({ where: { post: { auteurId: session.organisateurId, auteurType: "ORGANISATEUR" } } }),
    prisma.postCommentaire.count({ where: { post: { auteurId: session.organisateurId, auteurType: "ORGANISATEUR" } } }),
    prisma.postVue.count({ where: { post: { auteurId: session.organisateurId, auteurType: "ORGANISATEUR" } } }),
  ]);

  const locale = await getLocale();
  const t = await getTranslations("organisateur");
  const totalInscrits = evenements.reduce((acc, e) => acc + e._count.inscriptions, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("titreTableauDeBord")}</h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {organisateur?.nom}
          </p>
        </div>
        {organisateur?.verifie && (
          <span className="chip chip-success">
            <ShieldCheck size={13} />
            {t("verifie")}
          </span>
        )}
      </div>

      <BandeauStatistiquesProfil
        abonnes={abonnes}
        abonnements={abonnements}
        likes={likes}
        commentaires={commentaires}
        vues={vues}
        locale={locale}
      />

      <section className="grid grid-cols-2 gap-3">
        <div className="card flex flex-col items-center gap-1 py-4">
          <CalendarDays size={18} style={{ color: "var(--primary)" }} />
          <span className="text-lg font-bold">{evenements.length}</span>
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            {t("statEvenementsCrees")}
          </span>
        </div>
        <div className="card flex flex-col items-center gap-1 py-4">
          <Users size={18} style={{ color: "var(--primary)" }} />
          <span className="text-lg font-bold">{totalInscrits}</span>
          <span className="text-[11px]" style={{ color: "var(--muted)" }}>
            {t("statInscriptionsRecues")}
          </span>
        </div>
      </section>

      <CreateEventForm />

      <section className="flex flex-col gap-3">
        <h2 className="font-semibold">{t("mesEvenements")}</h2>
        {evenements.length === 0 && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {t("aucunEvenementCree")}
          </p>
        )}
        <div className="flex flex-col gap-2">
          {evenements.map((e) => (
            <Link
              key={e.id}
              href={`/organisateur/evenements/${e.id}`}
              className="card surface-hover flex items-center justify-between gap-3 p-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold">{e.nom}</h3>
                <div
                  className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs"
                  style={{ color: "var(--muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    {e.lieu}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(e.date).toLocaleDateString(locale)}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="chip chip-primary">
                  {e._count.inscriptions}/{e.placesMax}
                </span>
                <ChevronRight size={16} style={{ color: "var(--muted)" }} />
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
