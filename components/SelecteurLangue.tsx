"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Globe } from "lucide-react";
import { changerLangue } from "@/lib/locale";
import type { Locale } from "@/i18n/request";

const LANGUES: { code: Locale; label: string }[] = [
  { code: "fr", label: "Français" },
  { code: "en", label: "English" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
];

export default function SelecteurLangue({ compact = false }: { compact?: boolean }) {
  const locale = useLocale();
  const router = useRouter();
  const [ouvert, setOuvert] = useState(false);
  const [isPending, startTransition] = useTransition();

  function selectionner(code: Locale) {
    setOuvert(false);
    startTransition(async () => {
      await changerLangue(code);
      router.refresh();
    });
  }

  const langueActuelle = LANGUES.find((l) => l.code === locale) ?? LANGUES[0];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOuvert((v) => !v)}
        disabled={isPending}
        aria-label="Changer de langue"
        className={compact ? "btn btn-ghost !p-2" : "btn btn-secondary"}
      >
        <Globe size={compact ? 17 : 16} />
        {!compact && <span>{langueActuelle.label}</span>}
      </button>

      {ouvert && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOuvert(false)} />
          <div
            className="card absolute right-0 z-50 mt-2 flex w-40 flex-col gap-0.5 p-1.5"
            style={{ background: "var(--surface)" }}
          >
            {LANGUES.map((l) => (
              <button
                key={l.code}
                type="button"
                onClick={() => selectionner(l.code)}
                className="surface-hover rounded-lg px-3 py-2 text-left text-sm"
                style={{
                  color: l.code === locale ? "var(--primary)" : "var(--foreground)",
                  fontWeight: l.code === locale ? 600 : 400,
                }}
              >
                {l.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
