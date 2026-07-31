"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle } from "lucide-react";
import SportSelect from "@/components/SportSelect";

export default function InscriptionPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tCommun = useTranslations("commun");
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
      body.sportId = form.get("sportId");
    }

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    setChargement(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }

    router.push(role === "ATHLETE" ? "/profil" : "/organisateur");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-6 sm:pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">{t("titreInscription")}</h1>
        <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
          {t("sousTitreInscription")}
        </p>
      </div>

      <div className="card p-6">
        <div className="pill-toggle mb-5">
          <button
            type="button"
            onClick={() => setRole("ATHLETE")}
            className={`pill-toggle-btn ${role === "ATHLETE" ? "active" : ""}`}
          >
            {t("athlete")}
          </button>
          <button
            type="button"
            onClick={() => setRole("ORGANISATEUR")}
            className={`pill-toggle-btn ${role === "ORGANISATEUR" ? "active" : ""}`}
          >
            {t("organisateur")}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Champ label={t("nomComplet")} name="nom" required />
          <Champ label={t("email")} name="email" type="email" required />
          <Champ label={t("motDePasse")} name="password" type="password" required minLength={6} />

          {role === "ATHLETE" && (
            <>
              <Champ label={t("dateNaissance")} name="dateNaissance" type="date" required />
              <Champ label={t("ville")} name="ville" required />
              <label className="field-label">
                {t("sport")}
                <SportSelect name="sportId" required />
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
            {chargement ? t("creationEnCours") : t("creerMonCompte")}
          </button>
        </form>
      </div>

      <p className="text-center text-sm" style={{ color: "var(--muted)" }}>
        {t("dejaUnCompte")}{" "}
        <Link href="/connexion" className="font-medium" style={{ color: "var(--primary)" }}>
          {t("seConnecterLien")}
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
