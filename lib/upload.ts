import { randomUUID } from "crypto";
import { put } from "@vercel/blob";
import sharp from "sharp";

// Volontairement sous la limite de charge utile des fonctions serverless
// (Vercel plafonne autour de 4,5 Mo) : un fichier accepté ici doit toujours
// pouvoir être envoyé sans être rejeté par la plateforme d'hébergement.
export const TAILLE_MAX_FICHIER = 3 * 1024 * 1024; // 3 Mo
export const NOMBRE_MAX_IMAGES = 4;
// Le HEIC/HEIF (photos iPhone) est converti en JPEG côté client avant
// d'arriver ici (voir lib/heic.ts) : JPEG/JPG/PNG/WEBP sont acceptés en
// entrée du serveur (WEBP couvre beaucoup d'images enregistrées depuis un
// navigateur, ex. Pinterest/X) — GIF/AVIF/TIFF/BMP restent hors périmètre.
export const FORMATS_ACCEPTES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const LARGEUR_MAX = 1200;

// "carre"/"large" recadrent au centre vers un ratio fixe (avatar/bannière) ;
// "libre" se contente de réduire si trop grand, sans recadrer (fond d'écran,
// posts, événements — le contenu original doit rester intact).
export type FormeRecadrage = "carre" | "large" | "libre";

const DIMENSIONS_CIBLES: Record<Exclude<FormeRecadrage, "libre">, { width: number; height: number }> = {
  carre: { width: 500, height: 500 },
  large: { width: 1200, height: 400 },
};

// Minimum requis par forme : en dessous, l'image serait floue/pixélisée une
// fois recadrée à la taille cible — refusée plutôt que silencieusement
// dégradée. Propre à chaque forme car un carré et une bannière large n'ont
// pas les mêmes besoins (une bannière a besoin de bien plus de largeur).
export const DIMENSIONS_MIN: Record<FormeRecadrage, { width: number; height: number }> = {
  carre: { width: 300, height: 300 },
  large: { width: 600, height: 200 },
  libre: { width: 200, height: 200 },
};

// Compresse/redimensionne (et recadre au centre si demandé) puis envoie sur
// Vercel Blob. Retourne `{ tropPetite: true }` sans rien envoyer si l'image
// est en dessous du minimum requis pour la forme demandée.
export async function comprimerEtUploaderImage(
  buffer: Buffer,
  dossier: "posts" | "evenements" | "profils",
  forme: FormeRecadrage = "libre"
): Promise<{ url: string } | { tropPetite: true }> {
  const image = sharp(buffer);
  const metadata = await image.metadata();
  const min = DIMENSIONS_MIN[forme];
  if (!metadata.width || !metadata.height || metadata.width < min.width || metadata.height < min.height) {
    return { tropPetite: true };
  }

  // Le recadrage vers une forme fixe doit toujours produire exactement les
  // dimensions cibles, y compris en agrandissant si besoin — withoutEnlargement
  // empêcherait sharp d'agrandir le côté le plus court, cassant le recadrage
  // (ex. une source 1600x400 recadrée en "carre" 500x500 ressortait en
  // 500x400 au lieu de 500x500). Le contrôle qualité est déjà assuré par le
  // minimum requis ci-dessus, pas par withoutEnlargement.
  const redimensionnee =
    forme === "libre"
      ? image.resize({ width: LARGEUR_MAX, withoutEnlargement: true })
      : image.resize({ ...DIMENSIONS_CIBLES[forme], fit: "cover", position: "center" });

  const compresse = await redimensionnee.jpeg({ quality: 80 }).toBuffer();

  const nomFichier = `${dossier}/${randomUUID()}.jpg`;
  const blob = await put(nomFichier, compresse, {
    access: "public",
    contentType: "image/jpeg",
  });

  return { url: blob.url };
}
