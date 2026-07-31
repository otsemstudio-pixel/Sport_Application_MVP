"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import SportSelect from "@/components/SportSelect";

const NIVEAUX = [
  { value: "TOUS_NIVEAUX", label: "Tous niveaux" },
  { value: "DEBUTANT", label: "Débutant" },
  { value: "INTERMEDIAIRE", label: "Intermédiaire" },
  { value: "AVANCE", label: "Avancé" },
];

export default function CreateEventForm() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [ouvert, setOuvert] = useState(false);

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
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? "Une erreur est survenue.");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setOuvert(false);
    router.refresh();
  }

  if (!ouvert) {
    return (
      <button onClick={() => setOuvert(true)} className="btn btn-primary self-start">
        <Plus size={16} />
        Créer un événement
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card flex flex-col gap-3 p-5">
      <label className="field-label">
        Nom de l&apos;événement
        <input name="nom" required className="input" />
      </label>
      <label className="field-label">
        Sport
        <SportSelect name="sportId" required />
      </label>
      <label className="field-label">
        Description
        <textarea name="description" required rows={3} className="input resize-none" />
      </label>
      <label className="field-label">
        Lieu / ville
        <input name="lieu" required className="input" />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Date
          <input name="date" type="date" required className="input" />
        </label>
        <label className="field-label">
          Places maximum
          <input name="placesMax" type="number" min={1} required className="input" />
        </label>
      </div>
      <label className="field-label">
        Niveau requis
        <select name="niveauRequis" required defaultValue="TOUS_NIVEAUX" className="input">
          {NIVEAUX.map((n) => (
            <option key={n.value} value={n.value}>
              {n.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="clubRequis" type="checkbox" className="h-4 w-4" />
        Club requis (décoche pour ouvrir aux athlètes sans club)
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="field-label">
          Âge minimum (optionnel)
          <input name="ageMin" type="number" min={0} className="input" />
        </label>
        <label className="field-label">
          Âge maximum (optionnel)
          <input name="ageMax" type="number" min={0} className="input" />
        </label>
      </div>
      <label className="field-label">
        Nombre d&apos;équipes maximum (optionnel, sports collectifs)
        <input name="nombreEquipesMax" type="number" min={1} className="input" />
      </label>
      <label className="field-label">
        Équipement fourni (optionnel)
        <input name="equipementFourni" placeholder="Ex : ballons fournis, prévoir tenue de sport" className="input" />
      </label>
      <label className="field-label">
        Frais d&apos;inscription (FCFA)
        <input name="fraisInscription" type="number" min={0} defaultValue={0} className="input" />
      </label>
      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={chargement} className="btn btn-primary flex-1">
          {chargement ? "Création…" : "Créer"}
        </button>
        <button type="button" onClick={() => setOuvert(false)} className="btn btn-secondary">
          Annuler
        </button>
      </div>
    </form>
  );
}
