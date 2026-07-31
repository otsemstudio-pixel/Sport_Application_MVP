"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, PartyPopper, Plus, Send, Trash2, X } from "lucide-react";

type Exercice = {
  id: string;
  nom: string;
  uniteMesure: "REPETITIONS" | "DUREE_SECONDES" | "DISTANCE_METRES" | "SERIES_X_REPETITIONS";
};

type ExerciceAjoute = {
  exerciceId: string;
  nom: string;
  uniteMesure: Exercice["uniteMesure"];
  valeur: number;
  series?: number;
};

export default function SeanceEntrainementForm({ exercices }: { exercices: Exercice[] }) {
  const router = useRouter();
  const t = useTranslations("entrainement");
  const tCommun = useTranslations("commun");

  const [etape, setEtape] = useState<"repos" | "composition" | "termine">("repos");
  const [liste, setListe] = useState<ExerciceAjoute[]>([]);
  const [exerciceChoisi, setExerciceChoisi] = useState(exercices[0]?.id ?? "");
  const [valeur, setValeur] = useState("");
  const [series, setSeries] = useState("");
  const [noteOptionnelle, setNoteOptionnelle] = useState("");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveauxBadges, setNouveauxBadges] = useState<{ nom: string }[]>([]);

  const [seanceId, setSeanceId] = useState<string | null>(null);
  const [resume, setResume] = useState("");
  const [partageChargement, setPartageChargement] = useState(false);
  const [partageFait, setPartageFait] = useState(false);

  function libelleUnite(u: Exercice["uniteMesure"]) {
    return t(`unites.${u}`);
  }

  function ajouterExercice() {
    const exercice = exercices.find((e) => e.id === exerciceChoisi);
    if (!exercice || !valeur) return;
    setListe((prev) => [
      ...prev,
      {
        exerciceId: exercice.id,
        nom: exercice.nom,
        uniteMesure: exercice.uniteMesure,
        valeur: Number(valeur),
        series: series ? Number(series) : undefined,
      },
    ]);
    setValeur("");
    setSeries("");
  }

  function retirerExercice(index: number) {
    setListe((prev) => prev.filter((_, i) => i !== index));
  }

  function genererResume(exercicesRealises: ExerciceAjoute[]) {
    const lignes = exercicesRealises.map((e) =>
      e.series
        ? `${e.series}x${e.valeur} ${e.nom}`
        : `${e.valeur} ${libelleUnite(e.uniteMesure)} de ${e.nom}`
    );
    return `${t("resumeIntro")} ${lignes.join(", ")} 💪`;
  }

  async function terminerSeance() {
    if (liste.length === 0) return;
    setErreur(null);
    setChargement(true);

    const res = await fetch("/api/seances-entrainement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        noteOptionnelle: noteOptionnelle || undefined,
        exercices: liste.map((e) => ({
          exerciceId: e.exerciceId,
          valeur: e.valeur,
          series: e.series,
        })),
      }),
    });
    setChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }

    const data = await res.json();
    setSeanceId(data.seance.id);
    setNouveauxBadges(data.nouveauxBadges ?? []);
    setResume(genererResume(liste));
    setEtape("termine");
    router.refresh();
  }

  async function partagerSeance() {
    if (!seanceId || !resume.trim()) return;
    setErreur(null);
    setPartageChargement(true);

    const res = await fetch(`/api/seances-entrainement/${seanceId}/partager`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: resume }),
    });
    setPartageChargement(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setErreur(data.error ?? tCommun("erreurGenerique"));
      return;
    }
    setPartageFait(true);
  }

  function reinitialiser() {
    setEtape("repos");
    setListe([]);
    setNoteOptionnelle("");
    setSeanceId(null);
    setResume("");
    setPartageFait(false);
    setNouveauxBadges([]);
  }

  if (etape === "repos") {
    return (
      <button onClick={() => setEtape("composition")} className="btn btn-primary self-start">
        <Plus size={16} />
        {t("demarrerSeance")}
      </button>
    );
  }

  if (etape === "termine") {
    return (
      <div className="flex flex-col gap-3">
        <p className="chip chip-success self-start">
          <PartyPopper size={14} />
          {nouveauxBadges.length > 0
            ? t("seanceEnregistreeAvecBadges", { badges: nouveauxBadges.map((b) => b.nom).join(", ") })
            : t("seanceEnregistree")}
        </p>

        {!partageFait ? (
          <div className="card flex flex-col gap-2 p-4">
            <label className="field-label">
              {t("resumeAutoGenere")}
              <textarea
                value={resume}
                onChange={(e) => setResume(e.target.value)}
                maxLength={500}
                rows={3}
                className="input resize-none"
              />
            </label>
            {erreur && (
              <p className="chip chip-danger self-start">
                <AlertCircle size={14} />
                {erreur}
              </p>
            )}
            <div className="flex gap-2">
              <button
                onClick={partagerSeance}
                disabled={partageChargement || !resume.trim()}
                className="btn btn-primary flex-1"
              >
                <Send size={15} />
                {partageChargement ? t("partageEnCours") : t("partagerSeance")}
              </button>
              <button onClick={reinitialiser} className="btn btn-secondary">
                {t("nePasPartager")}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <p className="chip chip-success self-start">
              <Check size={14} />
              {t("seancePartagee")}
            </p>
            <button onClick={reinitialiser} className="btn btn-secondary self-start">
              {t("terminerEtEnregistrer")}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {liste.length > 0 && (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {liste.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                {e.series ? `${e.series}x${e.valeur}` : e.valeur} {!e.series && libelleUnite(e.uniteMesure)}{" "}
                <span className="font-medium">{e.nom}</span>
              </span>
              <button onClick={() => retirerExercice(i)} className="btn btn-ghost !p-1.5" aria-label={t("retirer")}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-[1fr_auto_auto] gap-2">
        <select value={exerciceChoisi} onChange={(e) => setExerciceChoisi(e.target.value)} className="input">
          {exercices.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.nom}
            </option>
          ))}
        </select>
        <input
          type="number"
          step="any"
          placeholder={t("valeurMesuree")}
          value={valeur}
          onChange={(e) => setValeur(e.target.value)}
          className="input w-24"
        />
        <input
          type="number"
          placeholder={t("seriesOptionnel")}
          value={series}
          onChange={(e) => setSeries(e.target.value)}
          className="input w-24"
        />
      </div>
      <button onClick={ajouterExercice} disabled={!valeur} className="btn btn-secondary self-start">
        <Plus size={15} />
        {t("ajouterExercice")}
      </button>

      <label className="field-label">
        {t("noteOptionnelleLabel")}
        <input
          value={noteOptionnelle}
          onChange={(e) => setNoteOptionnelle(e.target.value)}
          placeholder={t("noteOptionnellePlaceholder")}
          className="input"
        />
      </label>

      {erreur && (
        <p className="chip chip-danger self-start">
          <AlertCircle size={14} />
          {erreur}
        </p>
      )}

      <div className="flex gap-2">
        <button
          onClick={terminerSeance}
          disabled={liste.length === 0 || chargement}
          className="btn btn-primary flex-1"
        >
          {chargement ? t("enregistrementEnCours") : t("terminerEtEnregistrer")}
        </button>
        <button onClick={reinitialiser} className="btn btn-secondary">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
