"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, MessageCircle, ShieldAlert } from "lucide-react";

export default function ConsentementFlow({
  telephoneExistant,
  codeDejaEnvoye,
}: {
  telephoneExistant: string | null;
  codeDejaEnvoye: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("consentement");
  const tCommun = useTranslations("commun");
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
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    setMessage(t("codeEnvoyeMessage"));
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
      setErreur(data.error ?? tCommun("erreurGenerique"));
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
        <h2 className="font-semibold">{t("titre")}</h2>
      </div>
      <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
        {t("description")}
      </p>

      {etape === "telephone" && (
        <form onSubmit={envoyerCode} className="flex flex-col gap-3">
          <label className="field-label">
            {t("telephoneParent")}
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
            {chargement ? t("envoiEnCours") : t("envoyerCode")}
          </button>
        </form>
      )}

      {etape === "code" && (
        <form onSubmit={validerCode} className="flex flex-col gap-3">
          {message && <p className="chip chip-success self-start">{message}</p>}
          <label className="field-label">
            {t("codeRecu")}
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
              {chargement ? t("validationEnCours") : t("validerCode")}
            </button>
            <button type="button" onClick={() => setEtape("telephone")} className="btn btn-secondary">
              {t("renvoyer")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
