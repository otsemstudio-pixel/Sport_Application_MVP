import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";

// Volontairement sous la limite de charge utile des fonctions serverless
// (Vercel plafonne autour de 4,5 Mo) : un fichier accepté ici doit toujours
// pouvoir être envoyé sans être rejeté par la plateforme d'hébergement.
export const TAILLE_MAX_FICHIER = 3 * 1024 * 1024; // 3 Mo
export const NOMBRE_MAX_IMAGES = 4;
// Le HEIC/HEIF (photos iPhone) est converti en JPEG côté client avant
// d'arriver ici (voir lib/heic.ts) : seuls JPEG/JPG/PNG sont acceptés en
// entrée du serveur.
export const FORMATS_ACCEPTES = ["image/jpeg", "image/jpg", "image/png"];
const LARGEUR_MAX = 1200;

// Compresse/redimensionne l'image puis l'envoie sur Vercel Blob.
export async function comprimerEtUploaderImage(
  buffer: Buffer,
  dossier: "posts" | "evenements" | "profils"
): Promise<string> {
  const compresse = await sharp(buffer)
    .resize({ width: LARGEUR_MAX, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();

  const nomFichier = `${dossier}/${randomUUID()}.jpg`;
  const blob = await put(nomFichier, compresse, {
    access: "public",
    contentType: "image/jpeg",
  });

  return blob.url;
}
