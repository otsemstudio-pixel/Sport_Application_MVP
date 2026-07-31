import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";

export const TAILLE_MAX_FICHIER = 5 * 1024 * 1024; // 5 Mo
export const NOMBRE_MAX_IMAGES = 4;
const LARGEUR_MAX = 1600;

// Compresse/redimensionne l'image puis l'envoie sur Vercel Blob.
export async function comprimerEtUploaderImage(
  buffer: Buffer,
  dossier: "posts" | "evenements"
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
