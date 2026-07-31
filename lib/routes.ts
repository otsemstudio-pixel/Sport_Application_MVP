// Utilitaires de routage sans dépendance serveur : importable en toute
// sécurité depuis des "use client" components (lib/posts.ts importe prisma
// et ne doit jamais être chargé côté client).
export function hrefProfil(auteurType: "ATHLETE" | "ORGANISATEUR", auteurId: string) {
  return auteurType === "ATHLETE" ? `/athletes/${auteurId}` : `/organisateurs/${auteurId}`;
}
