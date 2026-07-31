import Link from "next/link";
import { getTranslations } from "next-intl/server";
import Logo from "@/components/nav/Logo";
import SelecteurLangue from "@/components/SelecteurLangue";

export default async function PublicHeader() {
  const t = await getTranslations("nav");
  return (
    <header
      className="sticky top-0 z-20 flex items-center justify-between border-b px-4 py-3.5 backdrop-blur-lg sm:px-8"
      style={{
        borderColor: "var(--border)",
        background: "color-mix(in srgb, var(--background) 85%, transparent)",
      }}
    >
      <Logo />
      <div className="flex items-center gap-2 text-sm">
        <SelecteurLangue compact />
        <Link href="/connexion" className="btn btn-ghost">
          {t("connexion")}
        </Link>
        <Link href="/inscription" className="btn btn-primary">
          {t("inscription")}
        </Link>
      </div>
    </header>
  );
}
