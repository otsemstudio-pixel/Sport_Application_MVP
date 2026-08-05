import { NextRequest, NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { JOKERS_MAX_PAR_MOIS } from "@/lib/assiduite";

// Utilise un joker pour un jour manqué récent — présenté comme un outil de
// gestion de la fatigue, pas un bouclier anti-punition illimité : la
// fenêtre est volontairement courte (7 jours) et le plafond mensuel est
// vérifié en application (comptage des lignes du mois en cours).
export async function POST(req: NextRequest) {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const { date } = (await req.json()) as { date?: string };
  if (!date) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }
  const dateCouverte = new Date(date);
  if (Number.isNaN(dateCouverte.getTime())) {
    return NextResponse.json({ error: t("champsManquants") }, { status: 400 });
  }
  dateCouverte.setUTCHours(0, 0, 0, 0);

  const aujourdhui = new Date();
  aujourdhui.setUTCHours(0, 0, 0, 0);
  const septJoursAvant = new Date(aujourdhui.getTime() - 7 * 86_400_000);

  if (dateCouverte.getTime() >= aujourdhui.getTime() || dateCouverte.getTime() < septJoursAvant.getTime()) {
    return NextResponse.json({ error: t("jokerDateInvalide") }, { status: 400 });
  }

  const [seance, preference, jokerExistant] = await Promise.all([
    prisma.seanceEntrainement.findFirst({
      where: {
        athleteId: session.athleteId,
        date: { gte: dateCouverte, lt: new Date(dateCouverte.getTime() + 86_400_000) },
      },
      select: { id: true },
    }),
    prisma.preferenceAssiduite.findUnique({ where: { athleteId: session.athleteId } }),
    prisma.jokerAssiduite.findUnique({
      where: { athleteId_dateCouverte: { athleteId: session.athleteId, dateCouverte } },
    }),
  ]);

  const dejaCouvert =
    !!seance || !!jokerExistant || (preference?.joursReposPlanifies.includes(dateCouverte.getUTCDay()) ?? false);
  if (dejaCouvert) {
    return NextResponse.json({ error: t("jokerDejaCouvert") }, { status: 409 });
  }

  const debutMois = new Date(Date.UTC(aujourdhui.getUTCFullYear(), aujourdhui.getUTCMonth(), 1));
  const jokersCeMois = await prisma.jokerAssiduite.count({
    where: { athleteId: session.athleteId, dateCouverte: { gte: debutMois } },
  });
  if (jokersCeMois >= JOKERS_MAX_PAR_MOIS) {
    return NextResponse.json({ error: t("jokerPlafondAtteint") }, { status: 409 });
  }

  await prisma.jokerAssiduite.create({ data: { athleteId: session.athleteId, dateCouverte } });

  return NextResponse.json({ ok: true }, { status: 201 });
}
