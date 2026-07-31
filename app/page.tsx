import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Dumbbell, ShieldCheck, Trophy, Users } from "lucide-react";

const ATOUTS = [
  {
    icon: Dumbbell,
    titre: "Entraînement gamifié",
    description:
      "Défis quotidiens, séances chronométrées et badges débloqués automatiquement à chaque palier franchi.",
  },
  {
    icon: Trophy,
    titre: "Classement local",
    description:
      "Compare ta régularité aux athlètes de ta ville et grimpe dans le classement basketball du quartier.",
  },
  {
    icon: ShieldCheck,
    titre: "Mineurs protégés",
    description:
      "Consentement parental obligatoire par SMS avant toute inscription à un tournoi pour les moins de 18 ans.",
  },
  {
    icon: Users,
    titre: "Organisateurs vérifiés",
    description:
      "Les organisateurs créent leurs tournois, gèrent les inscriptions et publient les résultats officiels.",
  },
];

export default async function Home() {
  const session = await getSession();
  if (session?.role === "ATHLETE") redirect("/entrainement");
  if (session?.role === "ORGANISATEUR") redirect("/organisateur");

  return (
    <div className="flex flex-col gap-20 pb-16">
      <section className="flex flex-col items-center gap-6 pt-10 text-center sm:pt-16">
        <span className="chip chip-primary">Basketball · Afrique</span>
        <h1 className="max-w-lg text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          Du terrain de quartier au{" "}
          <span style={{ color: "var(--primary)" }}>repérage en tournoi</span>
        </h1>
        <p
          className="max-w-md text-base leading-relaxed"
          style={{ color: "var(--muted)" }}
        >
          Enregistre tes séances, débloque des badges, grimpe dans le
          classement de ta ville et inscris-toi aux tournois près de chez toi.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link href="/inscription" className="btn btn-primary px-6 py-3 text-base">
            Créer un compte
          </Link>
          <Link href="/connexion" className="btn btn-secondary px-6 py-3 text-base">
            Connexion
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {ATOUTS.map((atout) => (
          <div key={atout.titre} className="card flex flex-col gap-3 p-5">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <atout.icon size={20} strokeWidth={2} />
            </div>
            <h3 className="font-semibold">{atout.titre}</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--muted)" }}>
              {atout.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
