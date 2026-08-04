import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const LIMITE = 5;

// Autocomplétion @mention : recherche par préfixe sur nomUtilisateur, tous
// comptes confondus (athlètes et organisateurs).
export async function GET(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const q = (req.nextUrl.searchParams.get("q") ?? "").toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!q) return NextResponse.json([]);

  const [athletes, organisateurs] = await Promise.all([
    prisma.athlete.findMany({
      where: { nomUtilisateur: { startsWith: q } },
      select: { nom: true, nomUtilisateur: true },
      take: LIMITE,
    }),
    prisma.organisateur.findMany({
      where: { nomUtilisateur: { startsWith: q } },
      select: { nom: true, nomUtilisateur: true },
      take: LIMITE,
    }),
  ]);

  const resultats = [...athletes, ...organisateurs]
    .map((c) => ({ valeur: c.nomUtilisateur, libelle: `@${c.nomUtilisateur} · ${c.nom}` }))
    .slice(0, LIMITE);

  return NextResponse.json(resultats);
}
