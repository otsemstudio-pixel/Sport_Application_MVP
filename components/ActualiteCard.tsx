"use client";

import { useLocale, useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

export type Actualite = {
  id: string;
  titre: string;
  resume: string;
  urlSource: string;
  imageUrl: string | null;
  sourceNom: string;
  sourceType: "NEWSDATA" | "RSS";
  categorie: "RESULTAT_TOURNOI" | "BOURSE_OPPORTUNITE" | "SELECTION_NATIONALE" | "GENERAL";
  sportId: string | null;
  publieLe: string;
};

const CHIP_CATEGORIE: Record<Actualite["categorie"], string> = {
  RESULTAT_TOURNOI: "chip-primary",
  BOURSE_OPPORTUNITE: "chip-gold",
  SELECTION_NATIONALE: "chip-success",
  GENERAL: "chip-neutral",
};

export default function ActualiteCard({ actualite, sportNom }: { actualite: Actualite; sportNom?: string }) {
  const locale = useLocale();
  const t = useTranslations("actualites");

  return (
    <a
      href={actualite.urlSource}
      target="_blank"
      rel="noopener noreferrer"
      className="card flex cursor-pointer flex-col gap-3 overflow-hidden p-4 sm:flex-row"
    >
      {actualite.imageUrl && (
        // <img> plutôt que next/image : la source vient de domaines externes
        // arbitraires (NewsData.io/RSS, n'importe quel média), impossible à
        // lister à l'avance dans next.config.ts remotePatterns.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={actualite.imageUrl}
          alt=""
          loading="lazy"
          className="h-44 w-full shrink-0 rounded-xl object-cover sm:h-28 sm:w-40"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`chip ${CHIP_CATEGORIE[actualite.categorie]}`}>{t(`categorie.${actualite.categorie}`)}</span>
          {sportNom && <span className="chip chip-neutral">{sportNom}</span>}
        </div>
        <h3 className="font-semibold leading-snug">{actualite.titre}</h3>
        <p className="line-clamp-2 text-sm" style={{ color: "var(--muted)" }}>
          {actualite.resume}
        </p>
        <div className="mt-auto flex items-center gap-1.5 pt-1.5">
          <span className="min-w-0 flex-1 truncate text-xs" style={{ color: "var(--muted)" }}>
            {new Date(actualite.publieLe).toLocaleDateString(locale, { day: "numeric", month: "short" })} · {actualite.sourceNom}
          </span>
          <ExternalLink size={13} className="shrink-0" style={{ color: "var(--muted)" }} />
        </div>
      </div>
    </a>
  );
}
