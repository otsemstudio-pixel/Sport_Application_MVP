// Convertit un fichier HEIC/HEIF (format par défaut des photos iPhone) en
// JPEG côté navigateur avant l'envoi au serveur : la bibliothèque d'image
// utilisée côté serveur (sharp) ne décode que le HEIF libre de droits
// (AVIF), pas le HEIC/HEVC des photos de téléphone — l'envoi échouerait
// sinon avec une erreur serveur peu claire.
const EXTENSIONS_HEIC = [".heic", ".heif"];
const TYPES_HEIC = ["image/heic", "image/heif", "image/heic-sequence", "image/heif-sequence"];

function estHeic(fichier: File): boolean {
  if (TYPES_HEIC.includes(fichier.type.toLowerCase())) return true;
  const nom = fichier.name.toLowerCase();
  return EXTENSIONS_HEIC.some((ext) => nom.endsWith(ext));
}

export async function convertirSiHeic(fichier: File): Promise<File> {
  if (!estHeic(fichier)) return fichier;

  const heic2any = (await import("heic2any")).default;
  const resultat = await heic2any({ blob: fichier, toType: "image/jpeg", quality: 0.85 });
  const blob = Array.isArray(resultat) ? resultat[0] : resultat;
  const nom = fichier.name.replace(/\.(heic|heif)$/i, ".jpg");
  return new File([blob], nom, { type: "image/jpeg" });
}
