import Image from "next/image";

// Fond photo plein écran, fixe (ne scrolle pas, ne se repaint pas pendant le
// scroll) et flouté via `filter` calculé une seule fois au rendu — à ne pas
// confondre avec `.glass`/`backdrop-filter`, dont le recalcul continu pendant
// le scroll est la source de ralentissement que ce mécanisme évite
// justement. Purement contrôlé par l'utilisateur (bascule + curseur de
// netteté dans Profil > Apparence), pas lié à la détection de capacité de
// DetectionEffetsVisuels (qui cible spécifiquement le coût du flou animé).
//
// `next/image` plutôt qu'un simple `background-image` CSS : ce composant
// s'affiche sur presque toutes les pages authentifiées, donc la moindre
// réduction de poids compte particulièrement en 3G/4G — l'optimiseur
// d'images sert automatiquement une variante WebP/AVIF plus légère que le
// JPEG déjà compressé de lib/sportBackgrounds.ts.
export default function FondSport({ imageUrl, nettete }: { imageUrl: string; nettete: number }) {
  const valeur = Math.min(100, Math.max(0, nettete));
  const flouPx = Math.round(((100 - valeur) / 100) * 22);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0" style={{ transform: "scale(1.12)" }}>
        <Image
          src={imageUrl}
          alt=""
          fill
          sizes="100vw"
          quality={60}
          className="object-cover"
          style={{ filter: `blur(${flouPx}px) saturate(1.05)` }}
        />
      </div>
      <div className="absolute inset-0" style={{ background: "color-mix(in srgb, var(--background) 72%, transparent)" }} />
    </div>
  );
}
