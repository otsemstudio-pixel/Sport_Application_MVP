import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/nav/Sidebar";
import BottomTabBar from "@/components/nav/BottomTabBar";
import MobileTopBar from "@/components/nav/MobileTopBar";
import PublicHeader from "@/components/nav/PublicHeader";
import type { NavLien } from "@/components/nav/NavLinks";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("commun");
  return {
    title: t("titreApp"),
    description: t("descriptionApp"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const locale = await getLocale();
  const messages = await getMessages();
  const t = await getTranslations("nav");

  let nom: string | null = null;
  if (session?.role === "ATHLETE") {
    nom = (await prisma.athlete.findUnique({
      where: { id: session.athleteId },
      select: { nom: true },
    }))?.nom ?? null;
  } else if (session?.role === "ORGANISATEUR") {
    nom = (await prisma.organisateur.findUnique({
      where: { id: session.organisateurId },
      select: { nom: true },
    }))?.nom ?? null;
  }

  const LIENS_ATHLETE: NavLien[] = [
    { href: "/entrainement", label: t("entrainement"), icon: "dumbbell" },
    { href: "/fil", label: t("fil"), icon: "fil" },
    { href: "/tournois", label: t("tournois"), icon: "trophy" },
    { href: "/profil", label: t("profil"), icon: "profil" },
  ];
  const LIENS_ORGANISATEUR: NavLien[] = [
    { href: "/organisateur", label: t("tableauDeBord"), icon: "dashboard" },
    { href: "/fil", label: t("fil"), icon: "fil" },
  ];

  const liens = session?.role === "ATHLETE" ? LIENS_ATHLETE : LIENS_ORGANISATEUR;

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <NextIntlClientProvider messages={messages}>
          {session ? (
            <div className="flex min-h-full">
              <Sidebar liens={liens} nom={nom} role={session.role} />
              <div className="flex min-h-full flex-1 flex-col sm:pl-64">
                <MobileTopBar role={session.role} />
                <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-24 pt-6 sm:px-8 sm:pb-10 sm:pt-8">
                  {children}
                </main>
              </div>
              <BottomTabBar liens={liens} />
            </div>
          ) : (
            <>
              <PublicHeader />
              <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-8">
                {children}
              </main>
            </>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
