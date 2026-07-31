"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Plus } from "lucide-react";
import SportSelect from "@/components/SportSelect";
import ImageUploader from "@/components/ImageUploader";

export default function CreateEventForm() {
  const router = useRouter();
  const t = useTranslations("organisateur");
  const tEvenement = useTranslations("evenement");
  const tAuth = useTranslations("auth");
  const tCommun = useTranslations("commun");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [images, setImages] = useState<string[]>([]);

  const NIVEAUX = ["TOUS_NIVEAUX", "DEBUTANT", "INTERMEDIAIRE", "AVANCE"] as const;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const form = new FormData(e.currentTarget);
    const nombre = (name: string) => {
      const v = form.get(name);
      return v ? Number(v) : undefined;
    };

    const res = await fetch("/api/evenements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.get("nom"),
        sportId: form.get("sportId"),
        lieu: form.get("lieu"),
        date: form.get("date"),
        placesMax: nombre("placesMax"),
        description: form.get("description"),
        niveauRequis: form.get("niveauRequis"),
        clubRequis: form.get("clubRequis") === "on",
        ageMin: nombre("ageMin"),
        ageMax: nombre("ageMax"),
        nombreEquipesMax: nombre("nombreEquipesMax"),
        equipementFourni: form.get("equipementFourni") || undefined,
        fraisInscription: nombre("fraisInscription") ?? 0,
        images,
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }

    (e.target as HTMLFormElement).reset();
    setImages([]);
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="btn btn-primary self-start">
        <Plus size={16} />
        {t("creerEvenement")}
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-5">
      <label className="field-label">
        {t("nomEvenement")}
        <input name="nom" required className="input" />
      </label>
      <label className="field-label">
        {tAuth("sport")}
        <SportSelect name="sportId" required />
      </label>
      <label className="field-label">
        {t("description")}
        <textarea name="description" required rows={3} className="input resize-none" />
      </label>
      <label className="field-label">
        {t("lieuVille")}
        <input name="lieu" required className="input" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          {t("date")}
          <input name="date" type="date" required className="input" />
        </label>
        <label className="field-label">
          {t("placesMaximum")}
          <input name="placesMax" type="number" min={1} required className="input" />
        </label>
      </div>
      <label className="field-label">
        {t("niveauRequis")}
        <select name="niveauRequis" required defaultValue="TOUS_NIVEAUX" className="input">
          {NIVEAUX.map((n) => (
            <option key={n} value={n}>
              {tEvenement(`niveaux.${n}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="clubRequis" type="checkbox" className="h-4 w-4" />
        {t("clubRequisCheckbox")}
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          {t("ageMinOptionnel")}
          <input name="ageMin" type="number" min={0} className="input" />
        </label>
        <label className="field-label">
          {t("ageMaxOptionnel")}
          <input name="ageMax" type="number" min={0} className="input" />
        </label>
      </div>
      <label className="field-label">
        {t("equipesMaxOptionnel")}
        <input name="nombreEquipesMax" type="number" min={1} className="input" />
      </label>
      <label className="field-label">
        {t("equipementOptionnel")}
        <input name="equipementFourni" placeholder={t("equipementPlaceholder")} className="input" />
      </label>
      <label className="field-label">
        {t("fraisInscriptionFcfa")}
        <input name="fraisInscription" type="number" min={0} defaultValue={0} className="input" />
      </label>
      <div className="field-label">
        {t("imagesJusqua4")}
        <ImageUploader dossier="evenements" value={images} onChange={setImages} />
      </div>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={chargement} className="btn btn-primary flex-1">
          {chargement ? t("creationEnCours") : t("creer")}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="btn btn-secondary">
          {t("annuler")}
        </button>
      </div>
    </form>
  );
}
