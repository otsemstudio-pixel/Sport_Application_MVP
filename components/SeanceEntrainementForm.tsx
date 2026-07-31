"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AlertCircle, Check, PartyPopper, Plus, Send, Sparkles, Trash2, X } from "lucide-react";
import MinuteurRepos from "@/components/MinuteurRepos";

type UniteMesure = "REPETITIONS" | "DUREE_SECONDES" | "DISTANCE_METRES" | "SERIES_X_REPETITIONS";

type Exercice = { id: string; nom: string; uniteMesure: UniteMesure };
type RecordAthlete = { exerciceId: string; valeur: number };
type ExercicePrevu = {
  exerciceId: string;
  seriesPrevues: number | null;
  repetitionsPrevues: number | null;
  dureePrevueSecondes: number | null;
  distancePrevueMetres: number | null;
  poidsPrevuKg: number | null;
};
type SeanceDuJourProgramme = { id: string; nomSeance: string; exercicesPrevus: ExercicePrevu[] };

type SerieAjoutee = {
  repetitions?: number;
  poidsKg?: number;
  dureeSecondes?: number;
  distanceMetres?: number;
};
type ExerciceEnCours = {
  exerciceId: string;
  nom: string;
  uniteMesure: UniteMesure;
  series: SerieAjoutee[];
};

function champPrincipal(u: UniteMesure): "repetitions" | "dureeSecondes" | "distanceMetres" {
  if (u === "DUREE_SECONDES") return "dureeSecondes";
  if (u === "DISTANCE_METRES") return "distanceMetres";
  return "repetitions";
}

export default function SeanceEntrainementForm({
  exercices,
  records,
  seanceDuJourProgramme,
}: {
  exercices: Exercice[];
  records: RecordAthlete[];
  seanceDuJourProgramme?: SeanceDuJourProgramme | null;
}) {
  const router = useRouter();
  const t = useTranslations("entrainement");
  const tCommun = useTranslations("commun");

  const [etape, setEtape] = useState<"repos" | "composition" | "termine">("repos");
  const [programmeSeanceIdActif, setProgrammeSeanceIdActif] = useState<string | null>(null);

  const [liste, setListe] = useState<ExerciceEnCours[]>([]);
  const [exerciceChoisi, setExerciceChoisi] = useState(exercices[0]?.id ?? "");
  const [seriesEnCours, setSeriesEnCours] = useState<SerieAjoutee[]>([]);
  const [valeurPrincipale, setValeurPrincipale] = useState("");
  const [poidsKg, setPoidsKg] = useState("");
  const [compteurMinuteur, setCompteurMinuteur] = useState(0);
  const [afficherMinuteur, setAfficherMinuteur] = useState(false);
  const [noteOptionnelle, setNoteOptionnelle] = useState("");

  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [nouveauxBadges, setNouveauxBadges] = useState<{ nom: string }[]>([]);
  const [nouveauxRecords, setNouveauxRecords] = useState<{ exerciceId: string; valeur: number }[]>([]);

  const [seanceId, setSeanceId] = useState<string | null>(null);
  const [resume, setResume] = useState("");
  const [partageChargement, setPartageChargement] = useState(false);
  const [partageFait, setPartageFait] = useState(false);

  const exerciceActuel = exercices.find((e) => e.id === exerciceChoisi);
  const champ = exerciceActuel ? champPrincipal(exerciceActuel.uniteMesure) : "repetitions";
  const recordActuel = exerciceActuel ? records.find((r) => r.exerciceId === exerciceActuel.id) : undefined;
  const exercicePrevu =
    programmeSeanceIdActif && exerciceActuel
      ? seanceDuJourProgramme?.exercicesPrevus.find((p) => p.exerciceId === exerciceActuel.id)
      : undefined;

  function libelleUnite(u: UniteMesure) {
    return t(`unites.${u}`);
  }

  function demarrerSeanceLibre() {
    setProgrammeSeanceIdActif(null);
    setEtape("composition");
  }

  function demarrerSeanceProgramme() {
    if (!seanceDuJourProgramme) return;
    setProgrammeSeanceIdActif(seanceDuJourProgramme.id);
    if (seanceDuJourProgramme.exercicesPrevus[0]) {
      setExerciceChoisi(seanceDuJourProgramme.exercicesPrevus[0].exerciceId);
    }
    setEtape("composition");
  }

  function ajouterSerie() {
    if (!exerciceActuel || !valeurPrincipale) return;
    const serie: SerieAjoutee = { [champ]: Number(valeurPrincipale) } as SerieAjoutee;
    if (poidsKg) serie.poidsKg = Number(poidsKg);
    setSeriesEnCours((prev) => [...prev, serie]);
    setValeurPrincipale("");
    setPoidsKg("");
    setCompteurMinuteur((c) => c + 1);
    setAfficherMinuteur(true);
  }

  function retirerSerieEnCours(index: number) {
    setSeriesEnCours((prev) => prev.filter((_, i) => i !== index));
  }

  function terminerExercice() {
    if (!exerciceActuel || seriesEnCours.length === 0) return;
    setListe((prev) => [
      ...prev,
      { exerciceId: exerciceActuel.id, nom: exerciceActuel.nom, uniteMesure: exerciceActuel.uniteMesure, series: seriesEnCours },
    ]);
    setSeriesEnCours([]);
    setAfficherMinuteur(false);
  }

  function retirerExercice(index: number) {
    setListe((prev) => prev.filter((_, i) => i !== index));
  }

  function formaterValeurSerie(s: SerieAjoutee, uniteMesure: UniteMesure) {
    const c = champPrincipal(uniteMesure);
    const valeur = s[c];
    return s.poidsKg ? `${valeur} @ ${s.poidsKg}kg` : `${valeur}`;
  }

  function genererResume(exercicesRealises: ExerciceEnCours[]) {
    const lignes = exercicesRealises.map(
      (e) => `${e.series.map((s) => formaterValeurSerie(s, e.uniteMesure)).join("/")} ${libelleUnite(e.uniteMesure)} de ${e.nom}`
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
        programmeSeanceId: programmeSeanceIdActif || undefined,
        exercices: liste.map((e) => ({
          exerciceId: e.exerciceId,
          series: e.series.map((s) => ({
            repetitions: s.repetitions,
            poidsKg: s.poidsKg,
            dureeSecondes: s.dureeSecondes,
            distanceMetres: s.distanceMetres,
          })),
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
    setNouveauxRecords(data.nouveauxRecords ?? []);
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
    setProgrammeSeanceIdActif(null);
    setListe([]);
    setSeriesEnCours([]);
    setAfficherMinuteur(false);
    setNoteOptionnelle("");
    setSeanceId(null);
    setResume("");
    setPartageFait(false);
    setNouveauxBadges([]);
    setNouveauxRecords([]);
  }

  if (etape === "repos") {
    return (
      <div className="flex flex-col gap-3">
        {seanceDuJourProgramme && (
          <div className="card flex flex-col gap-2 p-4" style={{ borderColor: "var(--primary)" }}>
            <p className="text-sm font-semibold">{t("seanceProgrammeDuJour", { nom: seanceDuJourProgramme.nomSeance })}</p>
            <button onClick={demarrerSeanceProgramme} className="btn btn-primary self-start">
              <Sparkles size={16} />
              {t("demarrerSeanceProgramme")}
            </button>
          </div>
        )}
        <button onClick={demarrerSeanceLibre} className="btn btn-secondary self-start">
          <Plus size={16} />
          {t("demarrerSeance")}
        </button>
      </div>
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

        {nouveauxRecords.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {nouveauxRecords.map((r) => {
              const exercice = exercices.find((e) => e.id === r.exerciceId);
              return (
                <p key={r.exerciceId} className="chip chip-gold">
                  <Sparkles size={13} />
                  {t("nouveauRecord", { nom: exercice?.nom ?? "", valeur: r.valeur })}
                </p>
              );
            })}
          </div>
        )}

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
    <div className="flex flex-col gap-4">
      {liste.length > 0 && (
        <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
          {liste.map((e, i) => (
            <div key={i} className="flex items-center justify-between gap-2 py-2 text-sm">
              <span>
                <span className="font-medium">{e.nom}</span>{" "}
                <span style={{ color: "var(--muted)" }}>
                  ({e.series.length} {t(e.series.length > 1 ? "series" : "serie")})
                </span>
              </span>
              <button onClick={() => retirerExercice(i)} className="btn btn-ghost !p-1.5" aria-label={t("retirer")}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="card flex flex-col gap-3 p-4">
        <select value={exerciceChoisi} onChange={(e) => setExerciceChoisi(e.target.value)} className="input">
          {exercices.map((ex) => (
            <option key={ex.id} value={ex.id}>
              {ex.nom}
            </option>
          ))}
        </select>

        {recordActuel != null && exerciceActuel && (
          <p className="chip chip-gold self-start">
            <Sparkles size={12} />
            {t("tonRecord", { valeur: recordActuel.valeur, unite: libelleUnite(exerciceActuel.uniteMesure) })}
          </p>
        )}
        {exercicePrevu && (
          <p className="chip chip-primary self-start">
            {t("objectifProgramme", {
              series: exercicePrevu.seriesPrevues ?? "?",
              valeur: exercicePrevu.repetitionsPrevues ?? exercicePrevu.dureePrevueSecondes ?? exercicePrevu.distancePrevueMetres ?? "?",
            })}
          </p>
        )}

        {seriesEnCours.length > 0 && exerciceActuel && (
          <div className="flex flex-col divide-y" style={{ borderColor: "var(--border)" }}>
            {seriesEnCours.map((s, i) => (
              <div key={i} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                <span>
                  {t("serieNumero", { n: i + 1 })} : {formaterValeurSerie(s, exerciceActuel.uniteMesure)} {libelleUnite(exerciceActuel.uniteMesure)}
                </span>
                <button onClick={() => retirerSerieEnCours(i)} className="btn btn-ghost !p-1" aria-label={t("retirer")}>
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {afficherMinuteur && <MinuteurRepos key={compteurMinuteur} />}

        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            step="any"
            placeholder={exerciceActuel ? libelleUnite(exerciceActuel.uniteMesure) : t("valeurMesuree")}
            value={valeurPrincipale}
            onChange={(e) => setValeurPrincipale(e.target.value)}
            className="input"
          />
          <input
            type="number"
            step="any"
            placeholder={t("poidsOptionnel")}
            value={poidsKg}
            onChange={(e) => setPoidsKg(e.target.value)}
            className="input"
          />
        </div>
        <div className="flex gap-2">
          <button onClick={ajouterSerie} disabled={!valeurPrincipale} className="btn btn-secondary flex-1">
            <Plus size={15} />
            {t("ajouterSerie")}
          </button>
          <button onClick={terminerExercice} disabled={seriesEnCours.length === 0} className="btn btn-primary flex-1">
            {t("terminerExercice")}
          </button>
        </div>
      </div>

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
