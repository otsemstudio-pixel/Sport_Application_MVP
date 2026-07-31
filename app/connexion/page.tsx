"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

export default function ConnexionPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ATHLETE" | "ORGANISATEUR">("ATHLETE");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        email: form.get("email"),
        password: form.get("password"),
      }),
    });

    setChargement(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    router.push(role === "ATHLETE" ? "/entrainement" : "/organisateur");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-6 sm:pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Connexion</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Content de te revoir.
        </p>
      </div>

      <div className="card p-6">
        <div className="pill-toggle mb-5">
          <button
            type="button"
            onClick={() => setRole("ATHLETE")}
            className={`pill-toggle-btn ${role === "ATHLETE" ? "active" : ""}`}
          >
            Athlète
          </button>
          <button
            type="button"
            onClick={() => setRole("ORGANISATEUR")}
            className={`pill-toggle-btn ${role === "ORGANISATEUR" ? "active" : ""}`}
          >
            Organisateur
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="field-label">
            Email
            <input name="email" type="email" required className="input" />
          </label>
          <label className="field-label">
            Mot de passe
            <input name="password" type="password" required className="input" />
          </label>

          {erreur && (
            <p className="chip chip-danger self-start">
              <AlertCircle size={14} />
              {erreur}
            </p>
          )}

          <button type="submit" disabled={chargement} className="btn btn-primary mt-1 py-3">
            {chargement ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-medium" style={{ color: "var(--primary)" }}>
          S&apos;inscrire
        </Link>
      </p>
    </div>
  );
}
