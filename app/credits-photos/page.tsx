import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { CREDITS_PHOTOS_SPORT } from "@/lib/sportBackgrounds";

export default async function CreditsPhotosPage() {
  const t = await getTranslations("creditsPhotos");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/profil" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourProfil")}
      </Link>

      <div>
        <h1 className="text-2xl font-bold">{t("titre")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t("description")}
        </p>
      </div>

      <ol className="card flex flex-col divide-y p-2" style={{ borderColor: "var(--border)" }}>
        {CREDITS_PHOTOS_SPORT.map((c) => (
          <li key={c.sport} className="flex items-center justify-between gap-3 px-3 py-3 text-sm">
            <div>
              <p className="font-medium">{c.sport}</p>
              <p style={{ color: "var(--muted)" }}>
                {c.attribution} · {c.licence}
              </p>
            </div>
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost !p-1.5 shrink-0"
              aria-label={t("voirSource")}
            >
              <ExternalLink size={15} />
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}
