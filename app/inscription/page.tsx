"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { AlertCircle, ChevronRight } from "lucide-react";
import SportSelect, { type Sport } from "@/components/SportSelect";
import Mascotte from "@/components/Mascotte";

type UniteMesure = "REPETITIONS" | "DUREE_SECONDES" | "DISTANCE_METRES" | "SERIES_X_REPETITIONS";
type ExerciceSuggere = { id: string; nom: string; uniteMesure: UniteMesure; beneficePerformance: string | null };

function champPrincipal(u: UniteMesure): "repetitions" | "dureeSecondes" | "distanceMetres" {
  if (u === "DUREE_SECONDES") return "dureeSecondes";
  if (u === "DISTANCE_METRES") return "distanceMetres";
  return "repetitions";
}

export default function InscriptionPage() {
  const router = useRouter();
  const t = useTranslations("auth");
  const tMascotte = useTranslations("mascotte");
  const tCommun = useTranslations("commun");

  // Assistant à 4 écrans maximum : (1) bienvenue, (2) formulaire de compte,
  // (3) premier défi réel (athlètes uniquement), (4) astuce finale.
  const [etape, setEtape] = useState<1 | 2 | 3 | 4>(1);
  const [role, setRole] = useState<"ATHLETE" | "ORGANISATEUR">("ATHLETE");
  const [sportChoisi, setSportChoisi] = useState<Sport | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const [exercices, setExercices] = useState<ExerciceSuggere[] | null>(null);
  const [exerciceChoisi, setExerciceChoisi] = useState("");
  const [valeurDefi, setValeurDefi] = useState("");
  const [defiChargement, setDefiChargement] = useState(false);
  const [defiFait, setDefiFait] = useState(false);

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

    if (role === "ORGANISATEUR") {
      router.push("/organisateur");
      router.refresh();
      return;
    }

    // La session athlète existe déjà (créée par l'API d'inscription) : on
    // peut donc enchaîner directement sur un vrai défi à l'étape 3.
    fetch("/api/exercices")
      .then((r) => (r.ok ? r.json() : []))
      .then((liste: ExerciceSuggere[]) => {
        setExercices(liste);
        if (liste[0]) setExerciceChoisi(liste[0].id);
      })
      .catch(() => setExercices([]));
    setEtape(3);
  }

  async function validerPremierDefi() {
    const exercice = exercices?.find((ex) => ex.id === exerciceChoisi);
    if (!exercice || !valeurDefi) return;
    setDefiChargement(true);
    const champ = champPrincipal(exercice.uniteMesure);
    await fetch("/api/seances-entrainement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exercices: [{ exerciceId: exercice.id, series: [{ [champ]: Number(valeurDefi) }] }],
      }),
    }).catch(() => {});
    setDefiChargement(false);
    setDefiFait(true);
  }

  async function terminerOnboarding() {
    await fetch("/api/profil/onboarding-complete", { method: "PATCH" }).catch(() => {});
    router.push("/entrainement");
    router.refresh();
  }

  const exerciceActuel = exercices?.find((ex) => ex.id === exerciceChoisi);

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 pt-6 sm:pt-10">
      {etape < 3 && (
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t("titreInscription")}</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--muted)" }}>
            {t("sousTitreInscription")}
          </p>
        </div>
      )}

      {etape === 1 && (
        <div className="card anim-fade-in-up flex flex-col gap-4 p-6">
          <Mascotte message={tMascotte("bienvenue")} taille={64} />
          <div className="flex gap-2">
            <button onClick={() => setEtape(2)} className="btn btn-primary flex-1">
              {t("commencer")}
              <ChevronRight size={16} />
            </button>
            <button onClick={() => setEtape(2)} className="btn btn-ghost">
              {t("passer")}
            </button>
          </div>
        </div>
      )}

      {etape === 2 && (
        <div className="anim-fade-in-up flex flex-col gap-6">
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
                    <SportSelect name="sportId" required onChange={setSportChoisi} />
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
      )}

      {etape === 3 && (
        <div className="card anim-fade-in-up flex flex-col gap-4 p-6">
          <Mascotte
            categorie={sportChoisi?.categoriePerformance}
            message={defiFait ? tMascotte("premierDefi") : t("premierDefiIntro")}
          />

          {!defiFait ? (
            <>
              {exercices === null ? (
                <p className="text-sm" style={{ color: "var(--muted)" }}>
                  {t("chargementExercices")}
                </p>
              ) : (
                <>
                  <select value={exerciceChoisi} onChange={(e) => setExerciceChoisi(e.target.value)} className="input">
                    {exercices.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.nom}
                      </option>
                    ))}
                  </select>
                  {exerciceActuel?.beneficePerformance && (
                    <p className="text-sm" style={{ color: "var(--muted)" }}>
                      {exerciceActuel.beneficePerformance}
                    </p>
                  )}
                  <input
                    type="number"
                    step="any"
                    placeholder={t("valeurDefiPlaceholder")}
                    value={valeurDefi}
                    onChange={(e) => setValeurDefi(e.target.value)}
                    className="input"
                  />
                  <button onClick={validerPremierDefi} disabled={!valeurDefi || defiChargement} className="btn btn-primary">
                    {defiChargement ? t("creationEnCours") : t("validerDefi")}
                  </button>
                </>
              )}
              <button onClick={() => setEtape(4)} className="btn btn-ghost self-center">
                {t("passer")}
              </button>
            </>
          ) : (
            <button onClick={() => setEtape(4)} className="btn btn-primary">
              {t("continuer")}
              <ChevronRight size={16} />
            </button>
          )}
        </div>
      )}

      {etape === 4 && (
        <div className="card anim-fade-in-up flex flex-col gap-4 p-6">
          <Mascotte categorie={sportChoisi?.categoriePerformance} message={tMascotte("astuce")} taille={64} />
          <button onClick={terminerOnboarding} className="btn btn-primary">
            {t("terminerOnboarding")}
          </button>
        </div>
      )}
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
      <input name={name} type={type} required={required} minLength={minLength} className="input" />
    </label>
  );
}
