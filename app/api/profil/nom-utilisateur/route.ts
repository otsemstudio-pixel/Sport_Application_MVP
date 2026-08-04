import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { auteurIdSession } from "@/lib/posts";
import { REGEX_NOM_UTILISATEUR } from "@/lib/nomUtilisateur";

export async function PATCH(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { nomUtilisateur } = await req.json();
  if (typeof nomUtilisateur !== "string") {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }
  const candidat = nomUtilisateur.trim().toLowerCase();
  if (!REGEX_NOM_UTILISATEUR.test(candidat)) {
    return NextResponse.json({ error: t("nomUtilisateurInvalide") }, { status: 400 });
  }

  // Unicité vérifiée en application à travers les deux tables (une
  // contrainte @unique Prisma ne porte que sur une seule table) — même
  // logique que le backfill initial.
  const [athleteExistant, organisateurExistant] = await Promise.all([
    prisma.athlete.findUnique({ where: { nomUtilisateur: candidat }, select: { id: true } }),
    prisma.organisateur.findUnique({ where: { nomUtilisateur: candidat }, select: { id: true } }),
  ]);
  const monId = auteurIdSession(session);
  const dejaPris =
    (athleteExistant && !(session.role === "ATHLETE" && athleteExistant.id === monId)) ||
    (organisateurExistant && !(session.role === "ORGANISATEUR" && organisateurExistant.id === monId));
  if (dejaPris) {
    return NextResponse.json({ error: t("nomUtilisateurPris") }, { status: 409 });
  }

  if (session.role === "ATHLETE") {
    await prisma.athlete.update({ where: { id: session.athleteId }, data: { nomUtilisateur: candidat } });
  } else {
    await prisma.organisateur.update({ where: { id: session.organisateurId }, data: { nomUtilisateur: candidat } });
  }

  return NextResponse.json({ nomUtilisateur: candidat });
}
