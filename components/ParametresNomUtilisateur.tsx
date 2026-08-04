"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, AtSign, Check } from "lucide-react";

export default function ParametresNomUtilisateur({ nomUtilisateurInitial }: { nomUtilisateurInitial: string }) {
  const router = useRouter();
  const t = useTranslations("mentions");
  const tCommun = useTranslations("commun");
  const [valeur, setValeur] = useState(nomUtilisateurInitial);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState(false);

  async function sauvegarder(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (valeur === nomUtilisateurInitial) return;
    setErreur(null);
    setSucces(false);
    setChargement(true);
    const res = await fetch("/api/profil/nom-utilisateur", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nomUtilisateur: valeur }),
    });
    setChargement(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    setSucces(true);
    router.refresh();
  }

  return (
    <div className="card flex flex-col gap-3 p-4">
      <h2 className="font-semibold">{t("nomUtilisateurLabel")}</h2>
      <p className="text-xs" style={{ color: "var(--muted)" }}>
        {t("nomUtilisateurDescription")}
      </p>
      <form onSubmit={sauvegarder} className="flex gap-2">
        <div className="input flex flex-1 items-center gap-1.5 !py-1.5">
          <AtSign size={14} style={{ color: "var(--muted)" }} />
          <input
            value={valeur}
            onChange={(e) => {
              setValeur(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""));
              setSucces(false);
            }}
            maxLength={20}
            className="w-full bg-transparent outline-none"
          />
        </div>
        <button type="submit" disabled={chargement || valeur === nomUtilisateurInitial} className="btn btn-secondary !px-3">
          {succes ? <Check size={15} /> : tCommun("enregistrer")}
        </button>
      </form>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
    </div>
  );
}
