import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import GraphiquesExercice from "@/components/GraphiquesExercice";
import { ArrowLeft } from "lucide-react";

export default async function ExerciceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ATHLETE") redirect("/connexion");
  const { id } = await params;

  const exercice = await prisma.exercice.findUnique({ where: { id } });
  if (!exercice) notFound();

  const t = await getTranslations("exercices");

  return (
    <div className="flex flex-col gap-6">
      <Link href="/entrainement" className="inline-flex items-center gap-1.5 text-sm" style={{ color: "var(--muted)" }}>
        <ArrowLeft size={14} />
        {t("retourEntrainement")}
      </Link>
      <h1 className="text-2xl font-bold">{exercice.nom}</h1>
      <GraphiquesExercice exerciceId={exercice.id} />
    </div>
  );
}
