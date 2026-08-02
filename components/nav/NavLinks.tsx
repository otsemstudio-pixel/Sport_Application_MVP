"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, LayoutDashboard, Newspaper, Rss, Trophy, UserRound, type LucideIcon } from "lucide-react";

export type IconKey = "dumbbell" | "trophy" | "profil" | "dashboard" | "fil" | "actualites";

const ICONS: Record<IconKey, LucideIcon> = {
  dumbbell: Dumbbell,
  trophy: Trophy,
  profil: UserRound,
  dashboard: LayoutDashboard,
  fil: Rss,
  actualites: Newspaper,
};

export type NavLien = { href: string; label: string; icon: IconKey };

export default function NavLinks({
  liens,
  variant,
}: {
  liens: NavLien[];
  variant: "sidebar" | "mobile";
}) {
  const pathname = usePathname();

  if (variant === "mobile") {
    return (
      <>
        {liens.map((lien) => {
          const actif = pathname === lien.href;
          const Icon = ICONS[lien.icon];
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className="flex flex-1 flex-col items-center justify-center gap-1 py-2"
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-full ${actif ? "nav-active-pill" : ""}`}>
                <Icon
                  size={20}
                  strokeWidth={actif ? 2.4 : 1.8}
                  style={{ color: actif ? "var(--primary)" : "var(--muted)" }}
                />
              </span>
              <span
                className="text-[11px] font-medium"
                style={{ color: actif ? "var(--primary)" : "var(--muted)" }}
              >
                {lien.label}
              </span>
            </Link>
          );
        })}
      </>
    );
  }

  return (
    <>
      {liens.map((lien) => {
        const actif = pathname === lien.href;
        const Icon = ICONS[lien.icon];
        return (
          <Link
            key={lien.href}
            href={lien.href}
            className="surface-hover flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium"
            style={{
              color: actif ? "var(--primary)" : "var(--foreground)",
              background: actif ? "var(--primary-soft)" : "transparent",
            }}
          >
            <Icon size={19} strokeWidth={actif ? 2.3 : 1.8} />
            {lien.label}
          </Link>
        );
      })}
    </>
  );
}
