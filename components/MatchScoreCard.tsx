"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin } from "lucide-react";

export type MatchDemo = {
  id: string;
  type: "EQUIPE" | "DUEL" | "COURSE";
  equipeA: string;
  equipeB: string;
  scoreA: number;
  scoreB: number;
  statutTexte: string | null;
  statut: "A_VENIR" | "EN_COURS" | "TERMINE";
  minuteAffichee: string | null;
  lieu: string;
  dateMatch: string;
  imageUrl: string;
  sport: { id: string; nom: string };
  participants: { id: string; position: number; nom: string; resultat: string }[];
};

function BadgeStatut({ statut }: { statut: MatchDemo["statut"] }) {
  const t = useTranslations("actualites");
  if (statut === "EN_COURS") {
    return (
      <span
        className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
        style={{ background: "var(--danger)" }}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        {t("enDirect")}
      </span>
    );
  }
  if (statut === "A_VENIR") return <span className="chip chip-neutral !bg-white/15 !text-white">{t("aVenir")}</span>;
  return <span className="chip chip-neutral !bg-white/15 !text-white">{t("termine")}</span>;
}

export default function MatchScoreCard({ match }: { match: MatchDemo }) {
  const hasScore = match.scoreA > 0 || match.scoreB > 0;

  return (
    <div className="relative h-40 w-64 shrink-0 overflow-hidden rounded-xl">
      {/* unoptimized : voir ArticleCard.tsx, même contournement du blocage
          429 de Wikimedia observé quand plusieurs images distinctes passent
          par l'optimiseur d'images du serveur en même temps. */}
      <Image src={match.imageUrl} alt="" fill sizes="256px" className="object-cover" unoptimized />
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(to top, rgba(0,0,0,.85), rgba(0,0,0,.25) 55%, rgba(0,0,0,.15))" }}
      />

      <div className="absolute left-2.5 right-2.5 top-2.5 flex items-center gap-1.5">
        <span className="shrink-0">
          <BadgeStatut statut={match.statut} />
        </span>
        <span className="chip chip-neutral !bg-white/15 !text-white min-w-0 truncate">{match.sport.nom}</span>
      </div>

      {match.type === "COURSE" ? (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-3 py-2.5 text-white">
          <span className="truncate text-sm font-semibold">{match.equipeA}</span>
          <div className="flex flex-col gap-0.5">
            {match.participants.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="min-w-0 truncate">
                  {p.position}. {p.nom}
                </span>
                <span className="shrink-0 opacity-85">{p.resultat}</span>
              </div>
            ))}
          </div>
          {match.statutTexte && <span className="truncate text-[11px] opacity-85">{match.statutTexte}</span>}
        </div>
      ) : (
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 px-3 py-2.5 text-white">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="min-w-0 flex-1 truncate">{match.equipeA}</span>
            {hasScore ? (
              <span className="shrink-0 text-base font-bold">
                {match.scoreA} - {match.scoreB}
              </span>
            ) : (
              <span className="shrink-0 text-xs font-bold opacity-70">VS</span>
            )}
            <span className="min-w-0 flex-1 truncate text-right">{match.equipeB}</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] opacity-85">
            <span className="flex min-w-0 flex-1 items-center gap-1 truncate">
              <MapPin size={11} className="shrink-0" />
              <span className="truncate">{match.lieu}</span>
            </span>
            <span className="shrink-0">{match.statutTexte ?? match.minuteAffichee}</span>
          </div>
        </div>
      )}
    </div>
  );
}
