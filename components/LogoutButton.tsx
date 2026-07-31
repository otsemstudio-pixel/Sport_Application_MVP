"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { LogOut } from "lucide-react";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  const t = useTranslations("nav");

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        aria-label={t("deconnexion")}
        className="btn btn-ghost !p-2"
      >
        <LogOut size={17} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button onClick={handleLogout} className="btn btn-secondary">
      <LogOut size={16} strokeWidth={1.8} />
      {t("deconnexion")}
    </button>
  );
}
