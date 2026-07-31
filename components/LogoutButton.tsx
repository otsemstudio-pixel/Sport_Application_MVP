"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  if (compact) {
    return (
      <button
        onClick={handleLogout}
        aria-label="Déconnexion"
        className="btn btn-ghost !p-2"
      >
        <LogOut size={17} strokeWidth={1.8} />
      </button>
    );
  }

  return (
    <button onClick={handleLogout} className="btn btn-secondary">
      <LogOut size={16} strokeWidth={1.8} />
      Déconnexion
    </button>
  );
}
