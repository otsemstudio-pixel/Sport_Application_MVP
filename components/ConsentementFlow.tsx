"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MessageCircle, ShieldAlert } from "lucide-react";

export default function ConsentementFlow({
  telephoneExistant,
  codeDejaEnvoye,
}: {
  telephoneExistant: string | null;
  codeDejaEnvoye: boolean;
}) {
  const router = useRouter();
  const [etape, setEtape] = useState<"telephone" | "code">(
    codeDejaEnvoye ? "code" : "telephone"
  );
  const [erreur, setErreur] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  async function envoyerCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const telephoneParent = new FormData(e.currentTarget).get("telephoneParent");

    const res = await fetch("/api/consentement/envoyer-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ telephoneParent }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    setMessage("Un code a été envoyé par SMS au parent (voir la console du serveur pour le MVP).");
    setEtape("code");
  }

  async function validerCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const code = new FormData(e.currentTarget).get("code");

    const res = await fetch("/api/consentement/valider", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }
    router.refresh();
  }

  return (
    <div
      className="card flex flex-col gap-4 p-5"
      style={{ borderColor: "var(--gold)", background: "var(--gold-soft)" }}
    >
      <div className="flex items-center gap-2">
        <ShieldAlert size={18} style={{ color: "var(--gold)" }} />
        <h2 className="font-semibold">Consentement parental requis</h2>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        Ce profil est mineur : il reste inactif (impossible de s&apos;inscrire à un
        tournoi) tant qu&apos;un parent n&apos;a pas validé un code envoyé par SMS.
      </p>

      {etape === "telephone" && (
        <form onSubmit={envoyerCode} className="flex flex-col gap-3">
          <label className="field-label">
            Téléphone du parent
            <input
              name="telephoneParent"
              type="tel"
              required
              defaultValue={telephoneExistant ?? ""}
              className="input"
            />
          </label>
          {erreur && (
            <p className="chip chip-danger self-start">
              <AlertCircle size={14} />
              {erreur}
            </p>
          )}
          <button type="submit" disabled={chargement} className="btn btn-primary">
            <MessageCircle size={16} />
            {chargement ? "Envoi…" : "Envoyer le code par SMS"}
          </button>
        </form>
      )}

      {etape === "code" && (
        <form onSubmit={validerCode} className="flex flex-col gap-3">
          {message && <p className="chip chip-success self-start">{message}</p>}
          <label className="field-label">
            Code reçu par le parent
            <input name="code" type="text" inputMode="numeric" required className="input" />
          </label>
          {erreur && (
            <p className="chip chip-danger self-start">
              <AlertCircle size={14} />
              {erreur}
            </p>
          )}
          <div className="flex gap-2">
            <button type="submit" disabled={chargement} className="btn btn-primary flex-1">
              {chargement ? "Validation…" : "Valider le code"}
            </button>
            <button type="button" onClick={() => setEtape("telephone")} className="btn btn-secondary">
              Renvoyer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
