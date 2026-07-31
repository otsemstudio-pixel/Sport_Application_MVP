"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle } from "lucide-react";

const SPORTS = [{ value: "basketball", label: "Basketball" }];

export default function InscriptionPage() {
  const router = useRouter();
  const [role, setRole] = useState<"ATHLETE" | "ORGANISATEUR">("ATHLETE");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {
      role,
      email: form.get("email"),
      password: form.get("password"),
      nom: form.get("nom"),
    };
    if (role === "ATHLETE") {
      body.dateNaissance = form.get("dateNaissance");
      body.ville = form.get("ville");
      body.sport = form.get("sport");
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setChargement(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    router.push(role === "ATHLETE" ? "/profil" : "/organisateur");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-6 sm:pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Créer un compte</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          Rejoins ScoutApp en tant qu&apos;athlète ou organisateur.
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
          <Champ label="Nom complet" name="nom" required />
          <Champ label="Email" name="email" type="email" required />
          <Champ label="Mot de passe" name="password" type="password" required minLength={6} />

          {role === "ATHLETE" && (
            <>
              <Champ label="Date de naissance" name="dateNaissance" type="date" required />
              <Champ label="Ville" name="ville" required />
              <label className="field-label">
                Sport
                <select name="sport" required className="input">
                  {SPORTS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}

          {erreur && (
            <p className="chip chip-danger self-start">
              <AlertCircle size={14} />
              {erreur}
            </p>
          )}

          <button type="submit" disabled={chargement} className="btn btn-primary mt-1 py-3">
            {chargement ? "Création…" : "Créer mon compte"}
          </button>
        </form>
      </div>

      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-medium" style={{ color: "var(--primary)" }}>
          Se connecter
        </Link>
      </p>
    </div>
  );
}

function Champ({
  label,
  name,
  type = "text",
  required,
  minLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="field-label">
      {label}
      <input
        name={name}
        type={type}
        required={required}
        minLength={minLength}
        className="input"
      />
    </label>
  );
}
