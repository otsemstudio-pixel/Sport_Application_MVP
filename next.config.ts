import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Photos uploadées par les utilisateurs (posts, événements).
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
      // Images de démonstration du script de seed.
      { protocol: "https", hostname: "picsum.photos" },
    ],
  },
};

export default withNextIntl(nextConfig);
