import { prisma } from "@/lib/prisma";

export const REGEX_NOM_UTILISATEUR = /^[a-z0-9_]{3,20}$/;

function slugifier(nom: string): string {
  const base = nom
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9_]+/g, "")
    .slice(0, 20);
  return base.length >= 3 ? base : "utilisateur";
}

// Génère un nomUtilisateur unique à travers Athlete ET Organisateur (une
// contrainte @unique Prisma ne porte que sur une seule table) à partir du
// nom d'affichage — utilisé à l'inscription pour ne pas exiger ce champ
// dans le formulaire, modifiable ensuite depuis les réglages de profil.
export async function genererNomUtilisateurUnique(nom: string): Promise<string> {
  const base = slugifier(nom);
  let candidat = base;
  let compteur = 2;
  // Le volume de comptes reste modeste (MVP) : une vérification séquentielle
  // en base est largement suffisante, pas besoin de charger toute la liste.
  while (true) {
    const [athlete, organisateur] = await Promise.all([
      prisma.athlete.findUnique({ where: { nomUtilisateur: candidat }, select: { id: true } }),
      prisma.organisateur.findUnique({ where: { nomUtilisateur: candidat }, select: { id: true } }),
    ]);
    if (!athlete && !organisateur) return candidat;
    candidat = `${base}_${compteur}`;
    compteur++;
  }
}
