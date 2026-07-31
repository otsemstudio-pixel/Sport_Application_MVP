"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";

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
    const res = await fetch("/api/evenements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nom: form.get("nom"),
        sport: form.get("sport"),
        lieu: form.get("lieu"),
        date: form.get("date"),
        placesMax: Number(form.get("placesMax")),
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
        <select name="sport" required defaultValue="basketball" className="input">
          <option value="basketball">Basketball</option>
        </select>
      </label>
      <label className="field-label">
        Lieu / ville
        <input name="lieu" required className="input" />
      </label>
      <label className="field-label">
        Date
        <input name="date" type="date" required className="input" />
      </label>
      <label className="field-label">
        Places maximum
        <input name="placesMax" type="number" min={1} required className="input" />
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
