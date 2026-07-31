import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "ScoutApp — Scouting sportif gamifié",
  description: "De l'entraînement de quartier au repérage en tournoi.",
};

const LIENS_ATHLETE: NavLien[] = [
  { href: "/entrainement", label: "Entraînement", icon: "dumbbell" },
  { href: "/fil", label: "Fil", icon: "fil" },
  { href: "/tournois", label: "Tournois", icon: "trophy" },
  { href: "/profil", label: "Profil", icon: "profil" },
];
const LIENS_ORGANISATEUR: NavLien[] = [
  { href: "/organisateur", label: "Tableau de bord", icon: "dashboard" },
  { href: "/fil", label: "Fil", icon: "fil" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

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

  const liens = session?.role === "ATHLETE" ? LIENS_ATHLETE : LIENS_ORGANISATEUR;

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
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
      </body>
    </html>
  );
}
