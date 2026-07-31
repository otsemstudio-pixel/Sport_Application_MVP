import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  const [tous, obtenus] = await Promise.all([
    prisma.badge.findMany({ orderBy: { seuilSeances: "asc" } }),
    prisma.athleteBadge.findMany({
      where: { athleteId: session.athleteId },
      select: { badgeId: true, obtenuLe: true },
    }),
  ]);

  const obtenusParId = new Map(obtenus.map((b) => [b.badgeId, b.obtenuLe]));

  return NextResponse.json(
    tous.map((badge) => ({
      ...badge,
      obtenu: obtenusParId.has(badge.id),
      obtenuLe: obtenusParId.get(badge.id) ?? null,
    }))
  );
}
