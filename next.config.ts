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
    remotePatterns: [
      // Photos uploadées par les utilisateurs (posts, événements).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Images de démonstration du script de seed.
      { protocol: "https", hostname: "picsum.photos" },
      // Photos par sport (Wikimedia Commons, libres de droits) utilisées pour
      // le menu Actualités — mêmes URLs que la galerie de CREDITS_PHOTOS_SPORT.
      { protocol: "https", hostname: "upload.wikimedia.org" },
    ],
  },
};

export default withNextIntl(nextConfig);
