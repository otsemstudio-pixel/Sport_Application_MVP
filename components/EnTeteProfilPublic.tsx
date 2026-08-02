import { getLocale, getTranslations } from "next-intl/server";
import { FileText, ShieldCheck, Users, Heart } from "lucide-react";
import AbonnementBouton from "@/components/AbonnementBouton";
import { formaterNombreCompact } from "@/lib/format";

export default async function EnTeteProfilPublic({
  nom,
  sousTitre,
  verifie = false,
  bannerUrl,
  posts,
  abonnes,
  likes,
  membreDepuis,
  estMoi,
  type,
  id,
  abonneInitial,
}: {
  nom: string;
  sousTitre?: string;
  verifie?: boolean;
  bannerUrl: string | null;
  posts: number;
  abonnes: number;
  likes: number;
  membreDepuis: Date;
  estMoi: boolean;
  type: "athlete" | "organisateur";
  id: string;
  abonneInitial: boolean;
}) {
  const locale = await getLocale();
  const t = await getTranslations("profilPublic");
  const initiale = nom.trim()[0]?.toUpperCase() ?? "?";

  return (
    <div className="card overflow-hidden">
      <div
        className="h-32 w-full sm:h-40"
        style={
          bannerUrl
            ? { backgroundImage: `url(${bannerUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : { background: "linear-gradient(135deg, var(--primary-soft), var(--gold-soft))" }
        }
      />

      <div className="flex flex-col items-center gap-2 px-5 pb-5">
        <div
          className="-mt-10 flex h-20 w-20 shrink-0 items-center justify-center rounded-full border-4 text-2xl font-bold"
          style={{ background: "var(--primary-soft)", color: "var(--primary)", borderColor: "var(--surface)" }}
        >
          {initiale}
        </div>

        <div className="flex items-center gap-1.5">
          <h1 className="text-xl font-bold">{nom}</h1>
          {verifie && <ShieldCheck size={17} style={{ color: "var(--success)" }} />}
        </div>
        {sousTitre && (
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            {sousTitre}
          </p>
        )}
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {t("membreDepuis", { date: membreDepuis.toLocaleDateString(locale, { month: "long", year: "numeric" }) })}
        </p>

        <div className="mt-2 flex items-center gap-6">
          <Statistique icon={FileText} valeur={posts} label={t("posts")} locale={locale} />
          <Statistique icon={Users} valeur={abonnes} label={t("abonnes")} locale={locale} />
          <Statistique icon={Heart} valeur={likes} label={t("likesRecus")} locale={locale} />
        </div>

        {!estMoi && (
          <div className="mt-3">
            <AbonnementBouton type={type} id={id} abonneInitial={abonneInitial} />
          </div>
        )}
      </div>
    </div>
  );
}

function Statistique({
  icon: Icon,
  valeur,
  label,
  locale,
}: {
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  valeur: number;
  label: string;
  locale: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <Icon size={14} style={{ color: "var(--muted)" }} />
      <span className="text-base font-bold">{formaterNombreCompact(valeur, locale)}</span>
      <span className="text-[10px]" style={{ color: "var(--muted)" }}>
        {label}
      </span>
    </div>
  );
}
