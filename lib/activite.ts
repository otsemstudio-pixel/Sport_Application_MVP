// Découpage pur (aucune requête ici) d'une liste de séances en points
// journaliers ou hebdomadaires — utilisé pour les graphiques de régularité
// sur /profil et /entrainement.

function debutJour(d: Date) {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function debutSemaine(d: Date) {
  const jour = (d.getDay() + 6) % 7; // lundi = 0
  const r = debutJour(d);
  r.setDate(r.getDate() - jour);
  return r;
}

function cleJour(d: Date) {
  return debutJour(d).toISOString().slice(0, 10);
}

function cleSemaine(d: Date) {
  return debutSemaine(d).toISOString().slice(0, 10);
}

// Une entrée par jour sur les `jours` derniers jours (aujourd'hui inclus),
// dans l'ordre chronologique — les jours sans séance apparaissent à 0.
export function activiteParJour(seances: { date: Date }[], jours: number) {
  const debut = debutJour(new Date());
  debut.setDate(debut.getDate() - (jours - 1));

  const comptes = new Map<string, number>();
  for (let i = 0; i < jours; i++) {
    const d = new Date(debut);
    d.setDate(d.getDate() + i);
    comptes.set(cleJour(d), 0);
  }
  for (const s of seances) {
    const cle = cleJour(s.date);
    if (comptes.has(cle)) comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
  }
  return [...comptes.entries()].map(([date, nombreSeances]) => ({ date, nombreSeances }));
}

// Une entrée par semaine (lundi de départ) sur les `semaines` dernières
// semaines, dans l'ordre chronologique.
export function activiteParSemaine(seances: { date: Date }[], semaines: number) {
  const debut = debutSemaine(new Date());
  debut.setDate(debut.getDate() - (semaines - 1) * 7);

  const comptes = new Map<string, number>();
  for (let i = 0; i < semaines; i++) {
    const d = new Date(debut);
    d.setDate(d.getDate() + i * 7);
    comptes.set(cleSemaine(d), 0);
  }
  for (const s of seances) {
    const cle = cleSemaine(s.date);
    if (comptes.has(cle)) comptes.set(cle, (comptes.get(cle) ?? 0) + 1);
  }
  return [...comptes.entries()].map(([semaineDebut, nombreSeances]) => ({ semaineDebut, nombreSeances }));
}
