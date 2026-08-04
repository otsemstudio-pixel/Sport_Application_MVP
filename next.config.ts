import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  experimental: {
    // Anime les changements de route avec l'API View Transitions native
    // (voir app/layout.tsx et le CSS ::view-transition-* dans globals.css) —
    // pas de librairie tierce.
    viewTransition: true,
  },
  images: {
    // AVIF avant WebP : ~20% plus léger à qualité égale (coût d'encodage
    // ponctuel absorbé par le cache d'images de Vercel, jamais répété pour
    // les mêmes dimensions) — le principal levier réseau sur 3G/4G.
    formats: ["image/avif", "image/webp"],
    // Next 16 exige une liste explicite (défaut : [75] uniquement) ; 60 est
    // utilisé pour le fond flouté plein écran (components/FondSport.tsx), où
    // le flou masque toute perte de qualité supplémentaire.
    qualities: [60, 75],
    remotePatterns: [
      // Photos uploadées par les utilisateurs (posts, événements) et photos
      // de sport re-hébergées (voir lib/sportBackgrounds.ts).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Images de démonstration du script de seed.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default withNextIntl(nextConfig);
