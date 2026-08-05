import { NextResponse } from "next/server";
import { getTranslations } from "next-intl/server";
import { getSession } from "@/lib/auth";
import { calculerAssiduite } from "@/lib/assiduite";

export async function GET() {
  const t = await getTranslations("erreurs");
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") {
    return NextResponse.json({ error: t("nonAuthentifie") }, { status: 401 });
  }

  const assiduite = await calculerAssiduite(session.athleteId);
  return NextResponse.json(assiduite);
}
