"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export default function BasculeMensurations({ activeInitial }: { activeInitial: boolean }) {
  const router = useRouter();
  const t = useTranslations("mensurations");
  const [active, setActive] = useState(activeInitial);
  const [chargement, setChargement] = useState(false);

  async function basculer() {
    setChargement(true);
    const res = await fetch("/api/mensurations/activation", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setChargement(false);
    if (res.ok) {
      setActive((v) => !v);
      router.refresh();
    }
  }

  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-sm font-semibold">{t("activerSuivi")}</p>
        <p className="text-xs" style={{ color: "var(--muted)" }}>
          {t("activerSuiviDescription")}
        </p>
      </div>
      <button
        onClick={basculer}
        disabled={chargement}
        role="switch"
        aria-checked={active}
        className="relative h-7 w-12 shrink-0 rounded-full transition-colors"
        style={{ background: active ? "var(--primary)" : "var(--surface-hover)" }}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: active ? "translateX(1.375rem)" : "translateX(0.125rem)" }}
        />
      </button>
    </div>
  );
}
