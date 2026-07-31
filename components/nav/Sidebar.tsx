import Logo from "@/components/nav/Logo";
import NavLinks, { type NavLien } from "@/components/nav/NavLinks";
import LogoutButton from "@/components/LogoutButton";

export default function Sidebar({
  liens,
  nom,
  role,
}: {
  liens: NavLien[];
  nom: string | null;
  role: "ATHLETE" | "ORGANISATEUR";
}) {
  const initiale = nom?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <aside
      className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 border-r px-4 py-6 sm:flex"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      <div className="px-1">
        <Logo href={role === "ATHLETE" ? "/entrainement" : "/organisateur"} />
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <NavLinks liens={liens} variant="sidebar" />
      </nav>

      <div
        className="flex items-center gap-3 rounded-xl border px-3 py-2.5"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          {initiale}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{nom ?? "Mon compte"}</p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {role === "ATHLETE" ? "Athlète" : "Organisateur"}
          </p>
        </div>
        <LogoutButton compact />
      </div>
    </aside>
  );
}
