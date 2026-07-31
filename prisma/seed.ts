import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });

const DEFIS = [
  {
    nom: "Dribbles en continu",
    description: "Enchaîner des dribbles sans perdre le ballon",
    unite: "dribbles",
  },
  {
    nom: "Tirs réussis",
    description: "Nombre de tirs réussis sur 20 tentatives",
    unite: "tirs",
  },
  {
    nom: "Sprint navette",
    description: "Temps sur un sprint navette 20m",
    unite: "secondes",
  },
  {
    nom: "Passes précises",
    description: "Passes réussies sur une cible sur 15 tentatives",
    unite: "passes",
  },
];

const BADGES = [
  {
    code: "regulier",
    nom: "Régulier",
    description: "5 séances enregistrées",
    seuilSeances: 5,
  },
  {
    code: "assidu",
    nom: "Assidu",
    description: "15 séances enregistrées",
    seuilSeances: 15,
  },
  {
    code: "habitue",
    nom: "Habitué",
    description: "30 séances enregistrées",
    seuilSeances: 30,
  },
];

async function main() {
  for (const defi of DEFIS) {
    await prisma.defi.upsert({
      where: { nom: defi.nom },
      update: {},
      create: { ...defi, sport: "basketball" },
    });
  }

  for (const badge of BADGES) {
    await prisma.badge.upsert({
      where: { code: badge.code },
      update: {},
      create: badge,
    });
  }

  console.log("Seed terminé : défis et badges basketball créés.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
