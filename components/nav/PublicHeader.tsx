import Link from "next/link";
import Logo from "@/components/nav/Logo";

export default function PublicHeader() {
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
        <Link href="/connexion" className="btn btn-ghost">
          Connexion
        </Link>
        <Link href="/inscription" className="btn btn-primary">
          Inscription
        </Link>
      </div>
    </header>
  );
}
