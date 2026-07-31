import { Eye, Heart, MessageCircle, UserPlus, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { formaterNombreCompact } from "@/lib/format";

export default async function BandeauStatistiquesProfil({
  abonnes,
  abonnements,
  likes,
  commentaires,
  vues,
  locale,
}: {
  abonnes: number;
  abonnements: number;
  likes: number;
  commentaires: number;
  vues: number;
  locale: string;
}) {
  const t = await getTranslations("profilPublic");
  const items = [
    { icon: Users, valeur: abonnes, label: t("abonnes") },
    { icon: UserPlus, valeur: abonnements, label: t("abonnements") },
    { icon: Heart, valeur: likes, label: t("likesRecus") },
    { icon: MessageCircle, valeur: commentaires, label: t("commentairesRecus") },
    { icon: Eye, valeur: vues, label: t("vuesRecues") },
  ];

  return (
    <div className="card grid grid-cols-5 gap-1 p-3">
      {items.map(({ icon: Icon, valeur, label }) => (
        <div key={label} className="flex flex-col items-center gap-0.5 text-center">
          <Icon size={15} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-bold">{formaterNombreCompact(valeur, locale)}</span>
          <span className="text-[9px] leading-tight" style={{ color: "var(--muted)" }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
